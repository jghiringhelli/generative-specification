# Kilnlog (command-line tool, Python 3.11, standard library only at runtime)

A potter wants a command `kiln` to plan and record kiln firings. Stack: Python 3.11, `argparse`, pytest for tests. The log lives in a JSON file at the path in the `KILNLOG` environment variable, default `~/.kilnlog.json`.

How it should behave:

1. `kiln plan --cone <06|6|10>` prints the firing schedule as three lines: `ramp 1: 20C -> 600C at 100C/h`, `ramp 2: 600C -> <target>C at 150C/h`, `hold: 15 min at <target>C`. Targets: cone 06 is 999C, cone 6 is 1222C, cone 10 is 1285C. It also prints a line `total: <h>h <mm>m` with the total time including the hold, rounded to the nearest minute.
2. An unknown cone prints `unknown cone: <value>` to standard error and exits with code 2.
3. `kiln log --cone <c> --peak <degrees> [--notes "text"]` appends a firing with today's date and prints `logged firing #<n>`, where n counts from 1. A peak that is not a whole number gets exit code 2.
4. A firing whose peak differs from the cone's target by more than 15C is marked off-target.
5. `kiln history` prints the firings newest first, one per line: `#<n> <date> cone <c> peak <p>C` followed by ` OFF-TARGET` when it applies. With an empty log it prints `no firings yet` and exits 0.
6. `kiln history --cone <c>` shows only that cone.
7. `kiln stats` prints the number of firings and, per cone, the average peak rounded to a whole degree.
8. Every command exits 0 on success; a corrupt log file exits with code 4 and the message `log file is corrupt: <path>`.

First slice to build: (a) `plan`, (b) `log` with the off-target mark, (c) `history`.
