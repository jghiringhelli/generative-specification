# CMP-1 power sketch, revision 2 (assumptions, no model run)

Simulated pilots per row: 4000. Two fixed vendors, k runs per vendor and arm. Descriptive intervals 95%; label intervals 98.33%. Margin Delta = 10 points. Class precedence and definitions: see the docstring of `simulate.py` and CMP-1 section 13. Pilot design is k = 5; k = 10 and 20 are shown to say what a larger study would buy (with the caution that more runs per vendor do not make the result more general: only more models do).

## 1. One contrast at a time (comparator arm Y, candidate arm X)

'AHEAD' uses the label interval (98.33%) and requires both vendor differences to have the pooled sign; the point-estimate-at-least-Delta condition of revision 1 is dropped (it capped power near 0.5). P(d >= 10 | ...) is shown separately.

### 1a. P-ACC2: share of 40 sealed phase-2 probes passed (higher is better; run SD 0.5 logit, vendor SD 0.4, vendor x arm SD 0.3)

Comparator mean 0.55. Rows with a true gain above 43 points are not feasible and are not printed.

| k | true gain (points) | P(AHEAD) | P(BEHIND) | P(TIE) | P(VENDOR-DEP) | P(INCONC) | mean 95% half-width (points) |
|---|---|---|---|---|---|---|---|
| 5 | 0 | 0.04 | 0.036 | 0.00 | 0.04 | 0.73 | 12.9 |
| 5 | 5 | 0.10 | 0.010 | 0.00 | 0.04 | 0.67 | 12.8 |
| 5 | 10 | 0.22 | 0.003 | 0.00 | 0.04 | 0.53 | 12.6 |
| 5 | 15 | 0.37 | 0.000 | 0.00 | 0.04 | 0.36 | 12.4 |
| 5 | 20 | 0.60 | 0.000 | 0.00 | 0.04 | 0.17 | 12.0 |
| 5 | 30 | 0.90 | 0.000 | 0.00 | 0.06 | 0.01 | 11.1 |
| 10 | 0 | 0.08 | 0.077 | 0.02 | 0.13 | 0.67 | 8.6 |
| 10 | 5 | 0.19 | 0.024 | 0.02 | 0.12 | 0.61 | 8.6 |
| 10 | 10 | 0.37 | 0.006 | 0.01 | 0.12 | 0.46 | 8.4 |
| 10 | 15 | 0.58 | 0.002 | 0.01 | 0.12 | 0.27 | 8.2 |
| 10 | 20 | 0.75 | 0.000 | 0.00 | 0.13 | 0.10 | 8.0 |
| 10 | 30 | 0.85 | 0.000 | 0.00 | 0.14 | 0.00 | 7.4 |
| 20 | 0 | 0.12 | 0.113 | 0.20 | 0.24 | 0.32 | 6.0 |
| 20 | 5 | 0.26 | 0.035 | 0.16 | 0.25 | 0.29 | 6.0 |
| 20 | 10 | 0.44 | 0.007 | 0.10 | 0.24 | 0.21 | 5.9 |
| 20 | 15 | 0.63 | 0.001 | 0.04 | 0.24 | 0.09 | 5.7 |
| 20 | 20 | 0.72 | 0.000 | 0.01 | 0.24 | 0.03 | 5.6 |
| 20 | 30 | 0.71 | 0.000 | 0.00 | 0.29 | 0.00 | 5.1 |

Comparator mean 0.85. Rows with a true gain above 14 points are not feasible and are not printed.

| k | true gain (points) | P(AHEAD) | P(BEHIND) | P(TIE) | P(VENDOR-DEP) | P(INCONC) | mean 95% half-width (points) |
|---|---|---|---|---|---|---|---|
| 5 | 0 | 0.03 | 0.026 | 0.11 | 0.03 | 0.77 | 8.7 |
| 5 | 5 | 0.16 | 0.002 | 0.12 | 0.04 | 0.63 | 7.9 |
| 5 | 10 | 0.59 | 0.000 | 0.04 | 0.05 | 0.26 | 7.1 |
| 10 | 0 | 0.07 | 0.065 | 0.41 | 0.09 | 0.38 | 5.8 |
| 10 | 5 | 0.33 | 0.003 | 0.32 | 0.10 | 0.24 | 5.2 |
| 10 | 10 | 0.81 | 0.000 | 0.04 | 0.12 | 0.03 | 4.7 |
| 20 | 0 | 0.10 | 0.101 | 0.55 | 0.20 | 0.04 | 4.0 |
| 20 | 5 | 0.45 | 0.006 | 0.33 | 0.20 | 0.02 | 3.6 |
| 20 | 10 | 0.73 | 0.000 | 0.02 | 0.26 | 0.00 | 3.2 |

### 1b. P-TRAP: share of 6 trap steps not handled correctly (lower is better; contrast = comparator minus candidate; run SD 0.7 logit, vendor SD 0.4, vendor x arm SD 0.3)

Comparator not-correct rate 0.5.

| k | true reduction (points) | P(AHEAD) | P(BEHIND) | P(TIE) | P(VENDOR-DEP) | P(INCONC) | mean 95% half-width (points) |
|---|---|---|---|---|---|---|---|
| 5 | 0 | 0.01 | 0.017 | 0.00 | 0.01 | 0.66 | 23.2 |
| 5 | 10 | 0.06 | 0.003 | 0.00 | 0.01 | 0.58 | 23.1 |
| 5 | 20 | 0.21 | 0.000 | 0.00 | 0.01 | 0.34 | 22.4 |
| 5 | 30 | 0.48 | 0.000 | 0.00 | 0.02 | 0.13 | 21.2 |
| 10 | 0 | 0.03 | 0.024 | 0.00 | 0.03 | 0.70 | 15.6 |
| 10 | 10 | 0.15 | 0.004 | 0.00 | 0.03 | 0.55 | 15.4 |
| 10 | 20 | 0.45 | 0.000 | 0.00 | 0.03 | 0.25 | 15.0 |
| 10 | 30 | 0.79 | 0.000 | 0.00 | 0.03 | 0.05 | 14.3 |
| 20 | 0 | 0.05 | 0.058 | 0.00 | 0.07 | 0.72 | 10.8 |
| 20 | 10 | 0.27 | 0.004 | 0.00 | 0.07 | 0.53 | 10.7 |
| 20 | 20 | 0.66 | 0.000 | 0.00 | 0.06 | 0.19 | 10.4 |
| 20 | 30 | 0.89 | 0.000 | 0.00 | 0.08 | 0.02 | 9.9 |

Comparator not-correct rate 0.3.

| k | true reduction (points) | P(AHEAD) | P(BEHIND) | P(TIE) | P(VENDOR-DEP) | P(INCONC) | mean 95% half-width (points) |
|---|---|---|---|---|---|---|---|
| 5 | 0 | 0.01 | 0.015 | 0.00 | 0.01 | 0.70 | 21.5 |
| 5 | 10 | 0.07 | 0.001 | 0.00 | 0.02 | 0.57 | 20.4 |
| 5 | 20 | 0.34 | 0.000 | 0.00 | 0.02 | 0.21 | 18.5 |
| 5 | 30 | 0.77 | 0.000 | 0.00 | 0.02 | 0.02 | 16.9 |
| 10 | 0 | 0.03 | 0.025 | 0.00 | 0.03 | 0.74 | 14.4 |
| 10 | 10 | 0.19 | 0.001 | 0.00 | 0.03 | 0.54 | 13.6 |
| 10 | 20 | 0.68 | 0.000 | 0.00 | 0.04 | 0.13 | 12.3 |
| 10 | 30 | 0.92 | 0.000 | 0.00 | 0.07 | 0.00 | 10.9 |
| 20 | 0 | 0.05 | 0.050 | 0.00 | 0.07 | 0.77 | 10.0 |
| 20 | 10 | 0.35 | 0.001 | 0.00 | 0.06 | 0.51 | 9.4 |
| 20 | 20 | 0.86 | 0.000 | 0.00 | 0.07 | 0.06 | 8.5 |
| 20 | 30 | 0.85 | 0.000 | 0.00 | 0.15 | 0.00 | 7.4 |

### 1c. Cost ratio X/Y (log-normal, run SD 0.30, vendor x arm SD 0.15)

| k | true ratio | P(COSTLIER: label interval entirely above 1) | P(CHEAPER) | mean 95% fold half-width |
|---|---|---|---|---|
| 5 | 1.0 | 0.04 | 0.041 | 1.33 |
| 5 | 1.1 | 0.10 | 0.015 | 1.33 |
| 5 | 1.25 | 0.24 | 0.004 | 1.33 |
| 5 | 1.5 | 0.58 | 0.000 | 1.34 |
| 5 | 2.0 | 0.93 | 0.000 | 1.33 |
| 5 | 3.0 | 1.00 | 0.000 | 1.34 |
| 10 | 1.0 | 0.09 | 0.100 | 1.21 |
| 10 | 1.1 | 0.22 | 0.033 | 1.21 |
| 10 | 1.25 | 0.46 | 0.006 | 1.21 |
| 10 | 1.5 | 0.82 | 0.000 | 1.21 |
| 10 | 2.0 | 1.00 | 0.000 | 1.21 |
| 10 | 3.0 | 1.00 | 0.000 | 1.21 |

### 1d. Sensitivity of P(AHEAD) to the run SD (k = 5; true 20-point P-ACC2 gain from 0.55; true 20-point P-TRAP reduction from 0.5)

| run SD (logit) | P-ACC2 P(AHEAD) | P-TRAP P(AHEAD) |
|---|---|---|
| 0.3 | 0.73 | 0.31 |
| 0.5 | 0.60 | 0.25 |
| 0.7 | 0.43 | 0.20 |
| 1.0 | 0.25 | 0.14 |

## 2. Operating characteristics of the registered composite codes (section 13), k = 5 per vendor and arm

Arms drawn jointly; vendor effect shared across arms; P-ACC2 on 40 probes (run SD 0.5), P-TRAP on 6 trap steps (run SD 0.7); cost log-normal (SD 0.30). Label intervals 98.33%. The codes are defined in section 13 of CMP-1; O1 and O2 require evidence (a tool BEHIND on a quality outcome, or COSTLIER with both quality outcomes TIE), O9 is the cost-only line. Probabilities over 4,000 simulated pilots.

| scenario | O1 G behind / costlier at tie | O2 K behind / costlier at tie | O3 bare holds | O4 G ahead | O5 K ahead | O6 a pair TIE on both | O8 all INCONCLUSIVE | O9 G costlier, quality unresolved | any AHEAD | any BEHIND | a GS 'higher' sentence (AHEAD only) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S0 global null, costs equal | 0.08 | 0.09 | 0.01 | 0.10 | 0.09 | 0.00 | 0.20 | 0.07 | 0.14 | 0.12 | 0.10 |
| S0c quality null, costs at the section 11 prior (K/B 3, G/B 2) | 0.09 | 0.11 | 0.56 | 0.10 | 0.09 | 0.00 | 0.18 | 0.76 | 0.14 | 0.14 | 0.10 |
| S1 G cuts trap failures by 20 points vs B and K, no P-ACC2 change, costs at prior | 0.06 | 0.27 | 0.28 | 0.36 | 0.07 | 0.00 | 0.08 | 0.55 | 0.40 | 0.11 | 0.37 |
| S2 G cuts trap failures by 10 points vs B and K, costs at prior | 0.07 | 0.13 | 0.43 | 0.17 | 0.08 | 0.00 | 0.14 | 0.71 | 0.21 | 0.11 | 0.17 |
| S3 both tools beat B by 20 points on both outcomes, K = G, costs at prior | 0.05 | 0.05 | 0.02 | 0.68 | 0.68 | 0.00 | 0.01 | 0.28 | 0.84 | 0.05 | 0.68 |
| S4 K beats G and B by 20 points on trap failures, costs at prior | 0.26 | 0.07 | 0.29 | 0.08 | 0.35 | 0.00 | 0.07 | 0.63 | 0.28 | 0.28 | 0.09 |

Reading: under the global null with equal costs (S0) the chance that some contrast carries an AHEAD or BEHIND label at all is the 'any AHEAD' and 'any BEHIND' columns; that is the family-wise false-label rate of the pilot and it is printed next to every public sentence (CMP-1 section 14). Under the cost prior with no quality difference (S0c) O9 is the expected line and O1 and O2 stay low, which is the point of requiring evidence for the two 'loses' codes.

## 3. Firing probabilities of the registered falsifiers (section 2)

| falsifier | when the prior is TRUE | when the prior is FALSE |
|---|---|---|
| H2 (G cuts trap failures by 20 vs the comparator; falsifier fires if pooled reduction < 5 and both vendor reductions < 10) | 0.10 | 0.48 |
| H2 as written in revision 1 (upper 95% bound below +10 and point estimate <= 0) | 0.01 | 0.16 |
| H3 (prior: ratio >= 1.25; falsifier fires if the upper 95% bound of the ratio to B is below 1.25; 'prior true' = true ratio 2.0, 'prior false' = true ratio 1.0) | 0.00 | 0.39 |
| H1 (prior: small differences; falsifier fires if the 95% interval lies entirely outside [-10, +10]; 'prior true' = true diff 0, 'prior false' = true diff 20, comparator 0.55) | 0.01 | 0.34 |

A falsifier that fires with probability below about 0.5 when the prior is false cannot refute that prior at k = 5; CMP-1 section 2 labels such rows 'not testable at k = 5'.

## 4. Interval check

- P-ACC2, k = 5, true difference 0 and no vendor x arm interaction: the 95% interval excludes 0 in 0.044 of simulations (nominal 0.05).
- With vendor x arm interaction SD 0.3 the 95% interval covers the conditional truth (mean over the two vendors of the vendor-specific differences) in 0.959 (nominal 0.95).
- With interaction, the 'true difference 0' rows are not zero for each vendor; the intervals are about THESE two vendors, and more runs per vendor do not buy generality to other vendors (only more models do). The false-label rates of section 2 (columns 'any AHEAD' and 'any BEHIND' in S0) are the quantities to read for claims about tools.
