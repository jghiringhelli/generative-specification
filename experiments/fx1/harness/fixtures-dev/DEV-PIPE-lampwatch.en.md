# Lampwatch (data pipeline, Node.js, standard library only at runtime)

A town hall receives street-lamp fault reports as CSV files and wants a nightly job that cleans them and produces a district summary. Stack: Node.js 24, no runtime dependencies, tests with `node --test`. Run as `node run.js <input.csv> [outdir]`; the output folder defaults to `output/`.

Input columns: `report_id,lamp_id,district,reported_at,severity,description` (header on the first line, `reported_at` in ISO 8601, severity 1 to 3).

How it should behave:

1. Rows with an empty `lamp_id`, an empty `district`, a severity that is not 1, 2 or 3, or an unparseable date are not processed: they are written to `rejected.csv` in the output folder with the original columns plus a `reason` column (`missing lamp_id`, `missing district`, `bad severity`, `bad date`).
2. A report for a lamp that was already reported less than 24 hours earlier (compared with the first accepted report of that lamp in that window) is a duplicate: it is left out of the summary and counted.
3. `summary.json` in the output folder holds: `processed` (accepted rows), `rejected`, `duplicates`, and `districts`, a list of `{ "district", "count", "avgSeverity" }` with the average to one decimal, sorted by count (highest first) and then by name.
4. A lamp with accepted reports on 3 or more different calendar days is listed in `chronic` in `summary.json`, with its report count, sorted by count.
5. Running it twice on the same input gives byte-identical output files.
6. An input file with only a header (or empty) writes no summary, prints `no data` and exits with code 3. A missing input file exits with code 2. Otherwise the exit code is 0.
7. The run prints one line: `processed=<n> rejected=<n> duplicates=<n>`.

First slice to build: (a) reading, validating and rejecting rows, (b) duplicate removal, (c) the district summary.
