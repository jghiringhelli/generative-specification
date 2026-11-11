# AX3 replication kit

You can help by running the generation step on your own machine, with whichever models you can access. You only generate. You do not measure: all scoring happens with one instrument, so results stay comparable.

## Before you start

1. Clone the repository and find the folder `experiments/ax3/`. Print its absolute path on your machine and use it as the root for everything below.
2. Check that these exist: `experiments/ax2/prompts/C1-naive/`, `C2-expert/`, `C3-gs/`, and `experiments/ax3/runs/` (create the last one if missing).
3. Write down the exact model identifier your tool shows. It goes into every `meta.json`. A run without it does not count.

## What to do

For each model you have access to, and for each condition C1, C2 and C3:

1. Open a **fresh session** with no earlier context.
2. Give it the prompts of that condition from `experiments/ax2/prompts/`, in file order, without changing them or adding your own instructions.
3. Let it finish. Do not fix its output by hand and do not rerun a run because you dislike the result.
4. Save the generated project to `experiments/ax3/runs/<who>/<model-id>/<condition>/<rep>/`, and add a `meta.json` with: model identifier, date, condition, rep number, tool name and version, and whether anything went wrong.
5. Do 3 reps per cell at least, 5 if you can.

Condition C4 (checks enforced in the loop) needs the gate runner, which is added to this folder before the first run. If it is not there yet, do C1 to C3 only.

## What to send back

The `runs/` folder, as a pull request or a zip. Do not send a written summary instead of the files. Do not include secrets, keys or personal data. Anything you send is published with the results, labelled with who ran it, so tell us how you want to be named.

## Notes

- Different models are welcome and are a feature, not a problem. Results are compared by the model you declare.
- Please do not look for the expected outcome. The kit does not say what we expect, so your runs are not influenced by it.
- If a run crashes or the session is cut, keep it, mark it in `meta.json`, and do not replace it silently.
