# Tidewatch (data pipeline)

We receive tide-gauge readings as messy CSV files from several harbour stations. I want a pipeline that cleans them and produces daily summaries I can query.

**Stack.** Python 3.11, standard library only (SQLite through `sqlite3`; pytest for tests).

**Input.** A folder of CSV files with the columns `station`, `timestamp`, `height`, `unit`. Timestamps are ISO 8601, with or without a UTC offset (without means the station's local time, given in a small `stations.csv`: station, utc_offset_hours). Units are `m` or `ft`.

**What it must do.**

1. Read every CSV in the input folder; skip rows that cannot be parsed and count them in a rejects table with the reason.
2. Convert all timestamps to UTC and all heights to metres.
3. Drop exact duplicate readings (same station and timestamp). If two readings share a station and timestamp but differ in height, keep the later row in the file and record the conflict.
4. Reject heights outside minus 3 m to plus 15 m as sensor errors.
5. A gap is more than 30 minutes between consecutive readings of a station. Fill gaps of at most 2 missing points by linear interpolation and mark those rows as filled; leave longer gaps unfilled and list them.
6. Write a database with `readings_clean`, `daily_summary` (station, UTC date, minimum, maximum, mean, count, filled count), `gaps` and `rejects`.
7. Flag as an anomaly any reading that is more than 3 median absolute deviations from the median of that station at the same hour of day.
8. Running the pipeline twice on the same folder gives the same database; new files add to it.
9. `tidewatch run --in <folder> --db <file>` runs it and prints a short report.

**First slice.** Parse, normalise, deduplicate and reject; then gaps; then the daily summary.

**My quality bar.** Tested on small made-up files, one command to run, and a re-run must never double count.
