#!/usr/bin/env python3
"""
AX runner — stats.py  (Protocol B analysis; pure stdlib, no scipy)

Reads results.csv and, for each objective metric, reports per-condition
descriptives (median / IQR / min / max / n) and, for each condition pair,
Cliff's delta (effect size + direction) and an EXACT two-sided Mann-Whitney U
p-value by full enumeration of rank assignments (correct for the small samples a
replication study produces; no normal approximation). p-values within each
metric's pairwise family are Holm-Bonferroni corrected.

At k=3 vs 3 the minimum achievable two-sided p is 0.10 — so k>=5 is required for
significance; this script is honest about that (reports p and flags underpowered).

Usage: python stats.py [results.csv]
Writes: stats.json  + prints a readable summary.
"""
import csv, json, sys, os, glob, itertools, statistics as st
from collections import defaultdict

CSV = sys.argv[1] if len(sys.argv) > 1 else "results.csv"
RUNS = os.path.join(os.path.dirname(os.path.abspath(CSV)) or ".", "runs")
# metrics where LOWER is better vs HIGHER is better (for delta direction labels).
# *_per_ts are size-normalized (per TypeScript source file) so GS emitting MORE code
# is not counted against it — the raw eslint/tsc counts are confounded by output size.
LOWER_BETTER = {"tsc_errors", "eslint_problems", "cves", "layer_violations",
                "total_cost_usd", "eslint_per_ts", "tsc_per_ts", "layer_per_ts"}
HIGHER_BETTER = {"coverage_pct", "audit1_total", "audit2_total", "files_count",
                 "test_files", "audit_mean"}
METRICS = list(LOWER_BETTER | HIGHER_BETTER)
AUDIT_PROPS = ["self_describing", "bounded", "verifiable", "defended",
               "auditable", "composable", "executable"]
# canonical ablation order if present, else alphabetical
ORDER = ["naive", "L1", "L2", "control", "treatment", "L4", "L5",
         "bridge-strong", "bridge-weak"]

def num(x):
    try:
        if x is None or x == "" or str(x).lower() in ("none", "null", "unknown", "false", "true"):
            return None
        return float(x)
    except (TypeError, ValueError):
        return None

def cliffs_delta(a, b):
    """delta = P(a>b) - P(a<b); range [-1,1]. |d|: .147 small .33 medium .474 large."""
    if not a or not b:
        return None
    gt = sum(1 for x in a for y in b if x > y)
    lt = sum(1 for x in a for y in b if x < y)
    return (gt - lt) / (len(a) * len(b))

def mannwhitney_u_exact_p(a, b):
    """Exact two-sided p by enumerating all rank-group assignments (ties handled
    via midranks). Fine for small n (n1+n2 choose n1 combinations)."""
    n1, n2 = len(a), len(b)
    if n1 == 0 or n2 == 0:
        return None
    N = n1 + n2
    # Enumerate every way to choose which N sorted-pool positions belong to group a;
    # two-sided p = fraction of assignments whose rank-sum deviates from the mean at
    # least as much as the observed one. Ties handled via midranks over the pool.
    sorted_pool = sorted(a + b)
    mids = _midranks(sorted_pool)
    obs = _assigned_ranksum(a, sorted_pool, mids)
    mean_rs = n1 * (N + 1) / 2
    obs_dev = abs(obs - mean_rs)
    total = count_ge = 0
    for combo in itertools.combinations(range(N), n1):
        rs = sum(mids[i] for i in combo)
        total += 1
        if abs(rs - mean_rs) >= obs_dev - 1e-9:
            count_ge += 1
    return count_ge / total if total else None

def _midranks(sorted_vals):
    mids = [0.0] * len(sorted_vals)
    i = 0
    while i < len(sorted_vals):
        j = i
        while j + 1 < len(sorted_vals) and sorted_vals[j + 1] == sorted_vals[i]:
            j += 1
        r = (i + j) / 2 + 1
        for k in range(i, j + 1):
            mids[k] = r
        i = j + 1
    return mids

def _assigned_ranksum(sample, sorted_pool, mids):
    pool = list(sorted_pool)
    total = 0.0
    used = [False] * len(pool)
    for v in sample:
        for idx in range(len(pool)):
            if not used[idx] and pool[idx] == v:
                total += mids[idx]
                used[idx] = True
                break
    return total

def holm(pairs):
    """pairs: list of (key, p). Returns dict key->adjusted p (Holm-Bonferroni)."""
    valid = [(k, p) for k, p in pairs if p is not None]
    valid.sort(key=lambda kp: kp[1])
    m = len(valid)
    out, running = {}, 0.0
    for rank, (k, p) in enumerate(valid):
        adj = min(1.0, (m - rank) * p)
        running = max(running, adj)  # enforce monotonic non-decreasing
        out[k] = round(running, 5)
    for k, p in pairs:
        if p is None:
            out[k] = None
    return out

def weighted_kappa(pairs, categories=(0, 1, 2)):
    """Quadratic-weighted Cohen's kappa on paired ordinal ratings (auditor1, auditor2).
    Measures inter-auditor reliability of the 7-property instrument."""
    pairs = [(int(a), int(b)) for a, b in pairs if a is not None and b is not None]
    n = len(pairs)
    if n == 0:
        return None
    k = len(categories)
    idx = {c: i for i, c in enumerate(categories)}
    O = [[0] * k for _ in range(k)]
    r1 = [0] * k
    r2 = [0] * k
    for a, b in pairs:
        if a not in idx or b not in idx:
            continue
        O[idx[a]][idx[b]] += 1
        r1[idx[a]] += 1
        r2[idx[b]] += 1
    W = [[((i - j) ** 2) / ((k - 1) ** 2) for j in range(k)] for i in range(k)]
    E = [[r1[i] * r2[j] / n for j in range(k)] for i in range(k)]
    num_ = sum(W[i][j] * O[i][j] for i in range(k) for j in range(k))
    den = sum(W[i][j] * E[i][j] for i in range(k) for j in range(k))
    return round(1 - num_ / den, 4) if den else None

def auditor_kappa():
    """Read every rep's audit-1/audit-2 and pair per-property scores for kappa."""
    pairs = []
    per_total = []  # (audit1_total, audit2_total) for exact-agreement context
    for a1p in glob.glob(os.path.join(RUNS, "*", "*", "audit-1.json")):
        a2p = a1p.replace("audit-1.json", "audit-2.json")
        try:
            j1 = json.load(open(a1p)); j2 = json.load(open(a2p))
        except (OSError, ValueError):
            continue
        s1, s2 = j1.get("scores") or {}, j2.get("scores") or {}
        for p in AUDIT_PROPS:
            if isinstance(s1.get(p), (int, float)) and isinstance(s2.get(p), (int, float)):
                pairs.append((s1[p], s2[p]))
        if isinstance(j1.get("total"), (int, float)) and isinstance(j2.get("total"), (int, float)):
            per_total.append((j1["total"], j2["total"]))
    kap = weighted_kappa(pairs)
    exact = sum(1 for a, b in pairs if a == b) / len(pairs) if pairs else None
    return {"weighted_kappa": kap, "exact_agreement": None if exact is None else round(exact, 3),
            "n_property_pairs": len(pairs), "n_reps": len(per_total)}

def descr(vals):
    v = [x for x in vals if x is not None]
    if not v:
        return {"n": 0}
    v.sort()
    q = (st.quantiles(v, n=4) if len(v) >= 2 else [v[0], v[0], v[0]])
    return {"n": len(v), "median": round(st.median(v), 4),
            "iqr": [round(q[0], 4), round(q[2], 4)], "min": round(min(v), 4),
            "max": round(max(v), 4), "mean": round(st.fmean(v), 4)}

def main():
    data = defaultdict(lambda: defaultdict(list))  # metric -> condition -> [vals]
    conds = []
    with open(CSV, newline="") as f:
        for row in csv.DictReader(f):
            c = row["condition"]
            if c not in conds:
                conds.append(c)
            # size-normalized densities + combined audit mean
            ts = num(row.get("ts_files")) or 0
            for base, deriv in (("eslint_problems", "eslint_per_ts"),
                                ("tsc_errors", "tsc_per_ts"),
                                ("layer_violations", "layer_per_ts")):
                v = num(row.get(base))
                row[deriv] = round(v / ts, 4) if (v is not None and ts) else ""
            a1, a2 = num(row.get("audit1_total")), num(row.get("audit2_total"))
            am = [x for x in (a1, a2) if x is not None]
            row["audit_mean"] = round(sum(am) / len(am), 4) if am else ""
            for mt in METRICS:
                data[mt][c].append(num(row.get(mt)))
    conds_ord = [c for c in ORDER if c in conds] + [c for c in conds if c not in ORDER]

    report = {"conditions": conds_ord, "metrics": {}}
    for mt in METRICS:
        per_cond = {c: descr(data[mt][c]) for c in conds_ord}
        # pairwise on adjacent + naive-vs-treatment style; do all pairs
        raw = []
        pairwise = {}
        for a, b in itertools.combinations(conds_ord, 2):
            av = [x for x in data[mt][a] if x is not None]
            bv = [x for x in data[mt][b] if x is not None]
            d = cliffs_delta(av, bv)
            p = mannwhitney_u_exact_p(av, bv) if av and bv else None
            key = f"{a}_vs_{b}"
            pairwise[key] = {"cliffs_delta": None if d is None else round(d, 4),
                             "p_exact": None if p is None else round(p, 5),
                             "n": [len(av), len(bv)]}
            raw.append((key, p))
        adj = holm(raw)
        for key in pairwise:
            pairwise[key]["p_holm"] = adj.get(key)
        report["metrics"][mt] = {"direction": "lower_better" if mt in LOWER_BETTER else "higher_better",
                                 "by_condition": per_cond, "pairwise": pairwise}

    report["auditor_reliability"] = auditor_kappa()

    with open("stats.json", "w") as f:
        json.dump(report, f, indent=2)

    # readable summary
    print(f"\nConditions: {', '.join(conds_ord)}")
    ncheck = {c: len([x for x in data['layer_violations'][c] if x is not None]) for c in conds_ord}
    print(f"n per condition (layer_violations): {ncheck}")
    if any(v and v < 5 for v in ncheck.values()):
        print("!! UNDERPOWERED for significance (need k>=5; k=3 gives effect sizes + direction only)")
    for mt in METRICS:
        m = report["metrics"][mt]
        line = " | ".join(f"{c}:{m['by_condition'][c].get('median','-')}" for c in conds_ord)
        print(f"\n[{mt}] ({m['direction']})  medians -> {line}")
        for key, pw in m["pairwise"].items():
            if pw["cliffs_delta"] is None:
                continue
            star = ""
            if pw["p_holm"] is not None and pw["p_holm"] < 0.05:
                star = " *"
            print(f"    {key}: delta={pw['cliffs_delta']:+.3f}  p={pw['p_exact']}  p_holm={pw['p_holm']}{star}")
    rel = report["auditor_reliability"]
    print(f"\n[auditor reliability] quadratic-weighted kappa={rel['weighted_kappa']} "
          f"exact-agreement={rel['exact_agreement']} (n={rel['n_property_pairs']} property-pairs, {rel['n_reps']} reps)")
    print("\nwrote stats.json")

if __name__ == "__main__":
    main()
