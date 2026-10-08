"""CMP-1 power sketch, revision 2. Every effect size and noise value is an ASSUMPTION; no model was run.

Design simulated: 2 vendors (fixed strata) x k runs per vendor per arm (k = 5 in the pilot); contrast d = mean over
vendors of (arm X minus arm Y); intervals are Welch-Satterthwaite t intervals on that vendor-stratified difference
(conditional on these two vendors; they say nothing about other vendors). Descriptive intervals are 95%; the
intervals that assign LABELS are Bonferroni-adjusted over the three contrasts (98.33%).

Outcomes: P-ACC2 (share of 40 sealed phase-2 non-trap probes passed), P-TRAP (share of 6 trap steps NOT handled
correctly, intention to treat, lower is better), COST (log-normal run cost).

Class codes per contrast and outcome (precedence in this order, the order registered in CMP-1 section 13):
  INCONC when both arms have zero variance in every cell; VD (vendor-dependent: the two per-vendor 95% intervals
  are disjoint); AHEAD / BEHIND (pooled label interval excludes 0 and both vendor differences have the pooled sign);
  TIE (label interval inside +/- Delta); SUGG+ / SUGG- (point estimate at least Delta in magnitude, both vendors the
  same sign, interval includes 0); else INCONC.

Run: python simulate.py  -> writes results.md and results.json next to this file.
"""
import json
import math
import os
import numpy as np
from statistics import NormalDist

RNG = np.random.default_rng(20261008)
NSIM = 4000
DELTA = 0.10
Z = NormalDist().inv_cdf
HERE = os.path.dirname(os.path.abspath(__file__))
A95 = 0.975
ALAB = 1 - 0.05 / 6          # two-sided 98.33%
INC, AHEAD, BEHIND, TIE, VD, SUGGP, SUGGM = 0, 1, -1, 2, 3, 4, -4
NAMES = {INC: "INCONCLUSIVE", AHEAD: "AHEAD", BEHIND: "BEHIND", TIE: "TIE", VD: "VENDOR-DEPENDENT", SUGGP: "SUGGESTED+", SUGGM: "SUGGESTED-"}


def tq(p, df):
    z = Z(p)
    return z + (z**3 + z) / (4 * df) + (5 * z**5 + 16 * z**3 + 3 * z) / (96 * df**2)


def tqv(p, df):
    return np.vectorize(lambda x: tq(p, x))(df)


def expit(x):
    return 1 / (1 + np.exp(-x))


def logit(p):
    return np.log(p / (1 - p))


def contrast(xs, ys, p):
    """xs, ys: (nsim, V, k). Returns pooled d, half-width at quantile p, per-vendor d, per-vendor 95% half-width, zero-variance flag."""
    nsim, V, k = xs.shape
    d_v = xs.mean(2) - ys.mean(2)
    d = d_v.mean(1)
    vx, vy = xs.var(2, ddof=1) / k, ys.var(2, ddof=1) / k
    terms = np.concatenate([vx, vy], axis=1) / (V**2)
    se2 = terms.sum(1)
    zero = se2 < 1e-12
    se = np.sqrt(se2 + 1e-12)
    den = (terms**2).sum(1) / (k - 1)
    df = np.clip(se2**2 / (den + 1e-18), 2.0, 60.0)
    hw = tqv(p, df) * se
    sev2 = vx + vy
    dfv = np.clip(sev2**2 / ((vx**2 + vy**2) / (k - 1) + 1e-18), 2.0, 60.0)
    hwv = tqv(A95, dfv) * np.sqrt(sev2 + 1e-12)
    return d, hw, d_v, hwv, zero


def classify(d, hw, d_v, hwv, zero):
    lo, hi = d - hw, d + hw
    sgn = np.sign(d)
    same = (np.sign(d_v) == sgn[:, None]).all(1)
    vlo, vhi = d_v - hwv, d_v + hwv
    disjoint = (vhi[:, 0] < vlo[:, 1]) | (vhi[:, 1] < vlo[:, 0])
    code = np.zeros(d.shape, dtype=int)
    done = zero.copy()
    m = (~done) & disjoint
    code[m] = VD; done |= m
    m = (~done) & (lo > 0) & same
    code[m] = AHEAD; done |= m
    m = (~done) & (hi < 0) & same
    code[m] = BEHIND; done |= m
    m = (~done) & (lo > -DELTA) & (hi < DELTA)
    code[m] = TIE; done |= m
    m = (~done) & same & (d >= DELTA)
    code[m] = SUGGP; done |= m
    m = (~done) & same & (d <= -DELTA)
    code[m] = SUGGM; done |= m
    return code


def frac(code, c):
    return float((code == c).mean())


def draw(mu, k, n_probe, sd_run, vend, sd_va=0.3):
    V = 2
    va = RNG.normal(0, sd_va, (NSIM, V, 1))
    run = RNG.normal(0, sd_run, (NSIM, V, k))
    p = expit(logit(mu) + vend + va + run)
    return RNG.binomial(n_probe, p) / n_probe


def draw_cost(ratio, k, sd_run=0.30, sd_va=0.15):
    va = RNG.normal(0, sd_va, (NSIM, 2, 1))
    run = RNG.normal(0, sd_run, (NSIM, 2, k))
    return math.log(ratio) + va + run


def single_tables(res, md):
    md += ["## 1. One contrast at a time (comparator arm Y, candidate arm X)", "",
           "'AHEAD' uses the label interval (98.33%) and requires both vendor differences to have the pooled sign; the point-estimate-at-least-Delta condition of revision 1 is dropped (it capped power near 0.5). P(d >= 10 | ...) is shown separately.", ""]
    md += ["### 1a. P-ACC2: share of 40 sealed phase-2 probes passed (higher is better; run SD 0.5 logit, vendor SD 0.4, vendor x arm SD 0.3)", ""]
    for base in (0.55, 0.85):
        md += [f"Comparator mean {base}. Rows with a true gain above {int(round((0.985-base)*100))} points are not feasible and are not printed.", "",
               "| k | true gain (points) | P(AHEAD) | P(BEHIND) | P(TIE) | P(VENDOR-DEP) | P(INCONC) | mean 95% half-width (points) |", "|---|---|---|---|---|---|---|---|"]
        for k in (5, 10, 20):
            for dp in (0, 5, 10, 15, 20, 30):
                if base + dp / 100 > 0.985:
                    continue
                vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
                x = draw(base + dp / 100, k, 40, 0.5, vend); y = draw(base, k, 40, 0.5, vend)
                d, hwl, dv, hwv, zero = contrast(x, y, ALAB)
                _, hw95, _, _, _ = contrast(x, y, A95)
                c = classify(d, hwl, dv, hwv, zero)
                row = dict(base=base, k=k, dp=dp, ahead=frac(c, AHEAD), behind=frac(c, BEHIND), tie=frac(c, TIE), vd=frac(c, VD), inc=frac(c, INC), hw=float(hw95.mean()))
                res["acc"].append(row)
                md.append(f"| {k} | {dp} | {row['ahead']:.2f} | {row['behind']:.3f} | {row['tie']:.2f} | {row['vd']:.2f} | {row['inc']:.2f} | {100*row['hw']:.1f} |")
        md.append("")
    md += ["### 1b. P-TRAP: share of 6 trap steps not handled correctly (lower is better; contrast = comparator minus candidate; run SD 0.7 logit, vendor SD 0.4, vendor x arm SD 0.3)", ""]
    for base in (0.5, 0.3):
        md += [f"Comparator not-correct rate {base}.", "",
               "| k | true reduction (points) | P(AHEAD) | P(BEHIND) | P(TIE) | P(VENDOR-DEP) | P(INCONC) | mean 95% half-width (points) |", "|---|---|---|---|---|---|---|---|"]
        for k in (5, 10, 20):
            for dp in (0, 10, 20, 30):
                cand = max(base - dp / 100, 0.02)
                vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
                cmp_ = draw(base, k, 6, 0.7, vend); can = draw(cand, k, 6, 0.7, vend)
                d, hwl, dv, hwv, zero = contrast(cmp_, can, ALAB)
                _, hw95, _, _, _ = contrast(cmp_, can, A95)
                c = classify(d, hwl, dv, hwv, zero)
                row = dict(base=base, k=k, dp=dp, ahead=frac(c, AHEAD), behind=frac(c, BEHIND), tie=frac(c, TIE), vd=frac(c, VD), inc=frac(c, INC), hw=float(hw95.mean()))
                res["trap"].append(row)
                md.append(f"| {k} | {dp} | {row['ahead']:.2f} | {row['behind']:.3f} | {row['tie']:.2f} | {row['vd']:.2f} | {row['inc']:.2f} | {100*row['hw']:.1f} |")
        md.append("")
    md += ["### 1c. Cost ratio X/Y (log-normal, run SD 0.30, vendor x arm SD 0.15)", "",
           "| k | true ratio | P(COSTLIER: label interval entirely above 1) | P(CHEAPER) | mean 95% fold half-width |", "|---|---|---|---|---|"]
    for k in (5, 10):
        for r in (1.0, 1.1, 1.25, 1.5, 2.0, 3.0):
            x = draw_cost(r, k); y = draw_cost(1.0, k)
            d, hwl, dv, hwv, zero = contrast(x, y, ALAB)
            _, hw95, _, _, _ = contrast(x, y, A95)
            row = dict(k=k, ratio=r, costlier=float((d - hwl > 0).mean()), cheaper=float((d + hwl < 0).mean()), fold=float(np.exp(hw95).mean()))
            res["cost"].append(row)
            md.append(f"| {k} | {r} | {row['costlier']:.2f} | {row['cheaper']:.3f} | {row['fold']:.2f} |")
    md.append("")
    md += ["### 1d. Sensitivity of P(AHEAD) to the run SD (k = 5; true 20-point P-ACC2 gain from 0.55; true 20-point P-TRAP reduction from 0.5)", "",
           "| run SD (logit) | P-ACC2 P(AHEAD) | P-TRAP P(AHEAD) |", "|---|---|---|"]
    for sd in (0.3, 0.5, 0.7, 1.0):
        vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
        x = draw(0.75, 5, 40, sd, vend); y = draw(0.55, 5, 40, sd, vend)
        c1 = classify(*contrast(x, y, ALAB))
        vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
        a = draw(0.5, 5, 6, sd, vend); b = draw(0.3, 5, 6, sd, vend)
        c2 = classify(*contrast(a, b, ALAB))
        md.append(f"| {sd} | {frac(c1, AHEAD):.2f} | {frac(c2, AHEAD):.2f} |")
    md.append("")


def scenarios(res, md):
    """Joint three-arm simulation: operating characteristics of the registered composite codes."""
    k = 5
    # scenario: (acc means B,K,G), (trap not-correct rates B,K,G), cost ratios (K/B, G/B)
    scen = {
        "S0 global null, costs equal": ((0.65, 0.65, 0.65), (0.5, 0.5, 0.5), (1.0, 1.0)),
        "S0c quality null, costs at the section 11 prior (K/B 3, G/B 2)": ((0.65, 0.65, 0.65), (0.5, 0.5, 0.5), (3.0, 2.0)),
        "S1 G cuts trap failures by 20 points vs B and K, no P-ACC2 change, costs at prior": ((0.65, 0.65, 0.65), (0.5, 0.5, 0.3), (3.0, 2.0)),
        "S2 G cuts trap failures by 10 points vs B and K, costs at prior": ((0.65, 0.65, 0.65), (0.5, 0.5, 0.4), (3.0, 2.0)),
        "S3 both tools beat B by 20 points on both outcomes, K = G, costs at prior": ((0.55, 0.75, 0.75), (0.5, 0.3, 0.3), (3.0, 2.0)),
        "S4 K beats G and B by 20 points on trap failures, costs at prior": ((0.65, 0.65, 0.65), (0.5, 0.3, 0.5), (3.0, 2.0)),
    }
    keys = ["O1_G_behind_or_costlier_at_tie", "O2_K_behind_or_costlier_at_tie", "O3_bare_holds", "O4_G_ahead", "O5_K_ahead",
            "O6_tie_pair", "O8_uninformative", "G_costlier_quality_unresolved", "any_AHEAD_label", "any_BEHIND_label", "pubrow_G_AHEAD_or_SUGG"]
    md += ["## 2. Operating characteristics of the registered composite codes (section 13), k = 5 per vendor and arm", "",
           "Arms drawn jointly; vendor effect shared across arms; P-ACC2 on 40 probes (run SD 0.5), P-TRAP on 6 trap steps (run SD 0.7); cost log-normal (SD 0.30). Label intervals 98.33%. The codes are defined in section 13 of CMP-1; O1 and O2 require evidence (a tool BEHIND on a quality outcome, or COSTLIER with both quality outcomes TIE), O9 is the cost-only line. Probabilities over 4,000 simulated pilots.", "",
           "| scenario | " + " | ".join(["O1 G behind / costlier at tie", "O2 K behind / costlier at tie", "O3 bare holds", "O4 G ahead", "O5 K ahead", "O6 a pair TIE on both", "O8 all INCONCLUSIVE", "O9 G costlier, quality unresolved", "any AHEAD", "any BEHIND", "a GS 'higher' sentence (AHEAD only)"]) + " |",
           "|---|" + "---|" * len(keys)]
    res["scen"] = {}
    for name, (acc, trap, (rk, rg)) in scen.items():
        vendA = RNG.normal(0, 0.4, (NSIM, 2, 1)); vendT = RNG.normal(0, 0.4, (NSIM, 2, 1))
        A = {a: draw(m, k, 40, 0.5, vendA) for a, m in zip("BKG", acc)}
        T = {a: draw(m, k, 6, 0.7, vendT) for a, m in zip("BKG", trap)}
        C = {"B": draw_cost(1.0, k), "K": draw_cost(rk, k), "G": draw_cost(rg, k)}
        pairs = [("G", "B"), ("K", "B"), ("G", "K")]
        qa = {p: classify(*contrast(A[p[0]], A[p[1]], ALAB)) for p in pairs}
        qt = {p: classify(*contrast(T[p[1]], T[p[0]], ALAB)) for p in pairs}   # positive = first arm has fewer failures
        def cost_cls(t, y):
            d, hw, _, _, _ = contrast(C[t], C[y], ALAB)
            return (d - hw > 0), (d + hw < 0)
        def pair(t, y):
            if (t, y) in pairs:
                return qa[(t, y)], qt[(t, y)], 1
            return -qa[(y, t)], -qt[(y, t)], -1   # swap sign of codes where meaningful
        def flip(code):
            out = code.copy()
            out[code == AHEAD] = BEHIND; out[code == BEHIND] = AHEAD
            out[code == SUGGP] = SUGGM; out[code == SUGGM] = SUGGP
            return out
        def qual(t, y):
            if (t, y) in pairs:
                return qa[(t, y)], qt[(t, y)]
            return flip(qa[(y, t)]), flip(qt[(y, t)])
        def behind(t, y):
            a, b = qual(t, y)
            return (a == BEHIND) | (b == BEHIND)
        def ahead(t, y):
            a, b = qual(t, y)
            return ((a == AHEAD) | (b == AHEAD)) & ~((a == BEHIND) | (b == BEHIND))
        def tie_both(t, y):
            a, b = qual(t, y)
            return (a == TIE) & (b == TIE)
        def costlier(t, y): return cost_cls(t, y)[0]
        def cheaper(t, y): return cost_cls(t, y)[1]
        o1 = behind("G", "K") | behind("G", "B") | (costlier("G", "K") & tie_both("G", "K")) | (costlier("G", "B") & tie_both("G", "B"))
        o2 = behind("K", "G") | behind("K", "B") | (costlier("K", "G") & tie_both("K", "G")) | (costlier("K", "B") & tie_both("K", "B"))
        sugg_vs_b = np.zeros(NSIM, dtype=bool)
        for t in "GK":
            a, b = qual(t, "B")
            sugg_vs_b |= (a == SUGGP) | (b == SUGGP)
        o3 = ~ahead("G", "B") & ~ahead("K", "B") & ~sugg_vs_b & cheaper("B", "G") & cheaper("B", "K")
        o4 = ahead("G", "K") | ahead("G", "B")
        o5 = ahead("K", "G") | ahead("K", "B")
        o6 = tie_both("G", "K") | tie_both("G", "B") | tie_both("K", "B")
        allinc = np.ones(NSIM, dtype=bool)
        anyahead = np.zeros(NSIM, dtype=bool); anybehind = np.zeros(NSIM, dtype=bool)
        for p in pairs:
            for c in (qa[p], qt[p]):
                allinc &= (c == INC)
                anyahead |= (c == AHEAD); anybehind |= (c == BEHIND)
        o9 = costlier("G", "K") | costlier("G", "B")
        o9 = o9 & ~o1 & ~o4
        pub = np.zeros(NSIM, dtype=bool)
        for p in (("G", "B"), ("G", "K")):
            a, b = qual(*p)
            pub |= (a == AHEAD) | (b == AHEAD)
        vals = [o1, o2, o3, o4, o5, o6, allinc, o9, anyahead, anybehind, pub]
        res["scen"][name] = {k_: float(v.mean()) for k_, v in zip(keys, vals)}
        md.append(f"| {name} | " + " | ".join(f"{float(v.mean()):.2f}" for v in vals) + " |")
    md.append("")
    md += ["Reading: under the global null with equal costs (S0) the chance that some contrast carries an AHEAD or BEHIND label at all is the 'any AHEAD' and 'any BEHIND' columns; that is the family-wise false-label rate of the pilot and it is printed next to every public sentence (CMP-1 section 14). Under the cost prior with no quality difference (S0c) O9 is the expected line and O1 and O2 stay low, which is the point of requiring evidence for the two 'loses' codes.", ""]


def falsifiers(res, md):
    k = 5
    md += ["## 3. Firing probabilities of the registered falsifiers (section 2)", "",
           "| falsifier | when the prior is TRUE | when the prior is FALSE |", "|---|---|---|"]
    # H2 weak falsifier: expected advantage not seen: pooled reduction < Delta/2 and both vendor reductions < Delta (G vs B, G vs K)
    rows = []
    for tag, true_red in (("H2 (G cuts trap failures by 20 vs the comparator; falsifier fires if pooled reduction < 5 and both vendor reductions < 10)", 0.20),):
        vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
        cmp_ = draw(0.5, k, 6, 0.7, vend); g_true = draw(0.3, k, 6, 0.7, vend); g_null = draw(0.5, k, 6, 0.7, vend)
        def fires(g):
            d_v = cmp_.mean(2) - g.mean(2); d = d_v.mean(1)
            return float(((d < 0.05) & (d_v < 0.10).all(1)).mean())
        md.append(f"| {tag} | {fires(g_true):.2f} | {fires(g_null):.2f} |")
    # H2 as written in revision 1: upper bound below +Delta and point <= 0
    vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
    cmp_ = draw(0.5, k, 6, 0.7, vend)
    for lab, mu in (("true: G cuts 20", 0.3), ("null: no effect", 0.5)):
        g = draw(mu, k, 6, 0.7, vend)
        d, hw, dv, hwv, zero = contrast(cmp_, g, A95)
        rows.append((lab, float(((d + hw < DELTA) & (d <= 0)).mean())))
    md.append(f"| H2 as written in revision 1 (upper 95% bound below +10 and point estimate <= 0) | {rows[0][1]:.2f} | {rows[1][1]:.2f} |")
    # H3: overhead of predicted size not seen: upper 95% bound of ratio T/B < 1.25
    for lab, r_true, r_false in (("H3 (prior: ratio >= 1.25; falsifier fires if the upper 95% bound of the ratio to B is below 1.25; 'prior true' = true ratio 2.0, 'prior false' = true ratio 1.0)", 2.0, 1.0),):
        out = []
        for r in (r_true, r_false):
            x = draw_cost(r, k); y = draw_cost(1.0, k)
            d, hw, _, _, _ = contrast(x, y, A95)
            out.append(float((d + hw < math.log(1.25)).mean()))
        md.append(f"| {lab} | {out[0]:.2f} | {out[1]:.2f} |")
    # H1: prior small differences |d|<10; falsified if the 95% interval lies entirely outside [-10,10]
    for lab, true_d in (("H1 (prior: small differences; falsifier fires if the 95% interval lies entirely outside [-10, +10]; 'prior true' = true diff 0, 'prior false' = true diff 20, comparator 0.55)", None),):
        out = []
        for dp in (0.0, 0.20):
            vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
            x = draw(0.55 + dp, k, 40, 0.5, vend); y = draw(0.55, k, 40, 0.5, vend)
            d, hw, _, _, _ = contrast(x, y, A95)
            out.append(float(((d - hw >= DELTA) | (d + hw <= -DELTA)).mean()))
        md.append(f"| {lab} | {out[0]:.2f} | {out[1]:.2f} |")
    md += ["", "A falsifier that fires with probability below about 0.5 when the prior is false cannot refute that prior at k = 5; CMP-1 section 2 labels such rows 'not testable at k = 5'.", ""]


def interval_check(res, md):
    gx, gw = np.polynomial.hermite_e.hermegauss(40)
    gw = gw / gw.sum()
    k = 5
    vend = RNG.normal(0, 0.4, (NSIM, 2, 1))
    x = draw(0.6, k, 40, 0.5, vend, sd_va=0.0); y = draw(0.6, k, 40, 0.5, vend, sd_va=0.0)
    d, hw, _, _, _ = contrast(x, y, A95)
    fp0 = float(((d - hw > 0) | (d + hw < 0)).mean())
    hit = 0; n = 1500
    for _ in range(n):
        vend1 = RNG.normal(0, 0.4, (1, 2, 1))
        va1 = RNG.normal(0, 0.3, (1, 2, 1)); va2 = RNG.normal(0, 0.3, (1, 2, 1))
        p1 = expit(logit(0.6) + vend1 + va1 + RNG.normal(0, 0.5, (1, 2, k))); p2 = expit(logit(0.6) + vend1 + va2 + RNG.normal(0, 0.5, (1, 2, k)))
        a = RNG.binomial(40, p1) / 40; b = RNG.binomial(40, p2) / 40
        d1, h1, _, _, _ = contrast(a, b, A95)
        cm = lambda va: np.array([(gw * expit(logit(0.6) + vend1[0, v, 0] + va[0, v, 0] + 0.5 * gx)).sum() for v in range(2)])
        truth = (cm(va1) - cm(va2)).mean()
        hit += int(abs(d1[0] - truth) <= h1[0])
    md += ["## 4. Interval check", "",
           f"- P-ACC2, k = 5, true difference 0 and no vendor x arm interaction: the 95% interval excludes 0 in {fp0:.3f} of simulations (nominal 0.05).",
           f"- With vendor x arm interaction SD 0.3 the 95% interval covers the conditional truth (mean over the two vendors of the vendor-specific differences) in {hit/n:.3f} (nominal 0.95).",
           "- With interaction, the 'true difference 0' rows are not zero for each vendor; the intervals are about THESE two vendors, and more runs per vendor do not buy generality to other vendors (only more models do). The false-label rates of section 2 (columns 'any AHEAD' and 'any BEHIND' in S0) are the quantities to read for claims about tools.", ""]
    res["null_false_exclusion_k5_no_interaction"] = fp0
    res["coverage_conditional_k5"] = hit / n


def main():
    res = {"acc": [], "trap": [], "cost": [], "assumptions": dict(NSIM=NSIM, DELTA=DELTA, label_alpha="98.33% (Bonferroni over 3 contrasts)")}
    md = ["# CMP-1 power sketch, revision 2 (assumptions, no model run)", "",
          f"Simulated pilots per row: {NSIM}. Two fixed vendors, k runs per vendor and arm. Descriptive intervals 95%; label intervals 98.33%. Margin Delta = 10 points. Class precedence and definitions: see the docstring of `simulate.py` and CMP-1 section 13. Pilot design is k = 5; k = 10 and 20 are shown to say what a larger study would buy (with the caution that more runs per vendor do not make the result more general: only more models do).", ""]
    single_tables(res, md)
    scenarios(res, md)
    falsifiers(res, md)
    interval_check(res, md)
    with open(os.path.join(HERE, "results.md"), "w") as f:
        f.write("\n".join(md))
    with open(os.path.join(HERE, "results.json"), "w") as f:
        json.dump(res, f, indent=1)
    print("\n".join(md))


if __name__ == "__main__":
    main()
