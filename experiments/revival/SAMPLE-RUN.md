# revival_v0 — sample runs (directional, provisional)

`node revival_v0.cjs <repo> [inputs.json]`. Reads objective signals (jscpd duplication, test ratio,
file-size, git churn, data-calls-in-routes) → exposure λ; takes a project profile (S,L,T,R,V) → impact
κ; applies the simple revival **filter** per practice (REVIVED / ALWAYS-WORTH / STILL-DEAD) and ranks by
benefit-per-residual-hour. **cov/c_res/c_AI/h0 are hand-set PROVISIONAL defaults — numbers are
directional, not calibrated.** λ is objective; κ/c_res/h0 need calibration from real outcomes.

## Run A — Cancha Libre, DEFAULT inputs (S=L=T=R=V=0.5)
Clean, GS-built repo: dup 0%, 6 src / 4 tests (ratio 0.67), 0 oversized files, 0 data-in-routes, low churn.
Honest read: **little to revive — it's already clean.** Top picks are the cheap governance/spec practices
that a clean repo still lacks (decision records, sentinel), and the two expensive practices come out
correctly negative:

```
🟢 REVIVED    decision records / doc-cascade   benefit≈2.07h  roi≈5.2   (unaudited-decision, divergence)
🟢 REVIVED    sentinel / authored navigation   benefit≈1.09h  roi≈3.6
🟢 REVIVED    perspective-based reading        benefit≈1.84h  roi≈2.3
🟢 REVIVED    acceptance/contract tests        benefit≈1.06h  roi≈2.1
🟢 REVIVED    layered boundaries + gate        benefit≈0.47h  roi≈1.6
🟢 REVIVED    mutation testing                 benefit≈0.41h  roi≈1.0
⚫ STILL-DEAD  formal property spec             benefit≈0.95h  roi≈0.8   residual 1.2h > benefit — not worth it here
⚫ STILL-DEAD  N-version                        benefit≈0.49h  roi≈0.4   residual 1.4h > benefit — not worth it here
```

## Run B — SAME repo, HIGH-STAKES / regulated inputs (S=1, R=0.9, V=0.9, T=0.7, L=0.8)
The point of the model: **the same project, different stakes → different answer.**

```
🟢 REVIVED    decision records / doc-cascade   benefit≈3.44h  roi≈8.6
🟢 REVIVED    sentinel / authored navigation   benefit≈1.72h  roi≈5.7
🟢 REVIVED    acceptance/contract tests        benefit≈1.94h  roi≈3.9
🟢 REVIVED    perspective-based reading        benefit≈2.99h  roi≈3.7
🟢 REVIVED    layered boundaries + gate        benefit≈0.72h  roi≈2.4
🟢 REVIVED    mutation testing                 benefit≈0.82h  roi≈2.1
🟢 REVIVED    formal property spec             benefit≈2.32h  roi≈1.9   ← FLIPPED from STILL-DEAD
```

**The headline behavior:** `formal property spec` moves **STILL-DEAD → REVIVED** when stakes+regulation+
verifiability rise (κ up via S/R, the V-gate opens). That is the thesis made calculable and actionable:
*a practice dead on a low-stakes clean app revives on a high-stakes regulated one, and the tool says which
and why, per project.*

## Honest status / what a v1 needs
- **Calibration:** cov, c_res, c_AI, h0 are provisional. Real values come from outcomes (the chronicle
  ledger's Δ-quality / hours-saved) — this is exactly the model-validation experiment.
- **Better detectors:** wire Gabriel's real detectors (`pragmaworks-gobernanza\...\detectores.js` —
  clone/config/symbol contradictions + the business-policy classifier) for λ instead of the v0 proxies;
  add config-contradiction detection (v0 uses a baseline).
- **The portfolio (v2):** v0 is the per-practice **filter** (ranked independently). The covariance-aware
  submodular selection + PCA redundancy diagnostic (per the model doc) is deliberately deferred until the
  filter is calibrated — don't let the optimizer outrun the data.
- **Cross-language:** v0's layer/churn heuristics are JS/TS-leaning; generalize per-stack.
