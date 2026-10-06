# Stitchcount (command-line tool)

I knit from written patterns and keep losing track of how many stitches a row leaves me with. I want a command-line tool that expands a row and counts stitches.

**Stack.** Python 3.11, standard library only (pytest for tests). Only runtime dependencies are fixed: development tools (test runners, linters, git hooks) are unrestricted.

**Row notation.** Tokens separated by commas: `k3` knit three, `p2` purl two, `yo` yarn over, `k2tog` knit two together, `ssk` slip-slip-knit. A group in parentheses followed by `x` and a number repeats: `(k2, p2) x3`. A bare `k` or `p` means one stitch.

**Stitch accounting.** `kN` and `pN` use N stitches and make N. `yo` uses none and makes one. `k2tog` and `ssk` use two and make one.

**What it must do.**

1. `stitchcount expand "<row>"` prints the row with repeats written out, one line.
2. `stitchcount count --start 24 "<row>"` prints how many stitches the row ends with, given the stitches on the needle at the start.
3. If a row needs more stitches than are on the needle, it says so and exits with code 3.
4. A malformed row (unknown token, unbalanced parenthesis, repeat of zero) exits with code 2 and a message that points at the problem.
5. `stitchcount rows pattern.txt` reads a multi-row file, one row per line, with a starting count on the first line, and checks each row against the count the previous row left. It prints a table of row, used, made and end count, and stops at the first row that does not fit.
6. Blank lines and lines starting with `#` in a pattern file are ignored.
7. `--help` explains the notation.

**First slice.** `expand`, `count`, and the error exit codes.

**My quality bar.** Tested, one install-and-run line in the README, and clear errors a beginner can read.
