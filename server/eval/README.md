# Yojana Saathi - pilot evaluation pack

Measures three things on the real system: (1) how well Groq/Llama extracts the profile from
English, Hindi and Bengali text, (2) whether the recommendation engine ranks sensible schemes
compared with a plain keyword search, (3) whether the ELIGIBLE badge can be trusted.

Nothing here writes to the database.

## Phase 1 - run the system (one person, about 10 minutes)

1. Copy this `eval` folder into `server/` so you have `server/eval/runEval.js`.
2. Make sure `server/.env` has `DATABASE_URL`, `GROQ_API_KEY` and `GROQ_MODEL=llama-3.3-70b-versatile`,
   and that the database is **already fixed and seeded** (schemes Active, translations loaded).
3. From the `server` folder:
   ```
   node eval/runEval.js --limit 3      # quick check, should finish in under a minute
   node eval/runEval.js                # full run: 60 profiles, about 3-5 minutes
   ```
   If you see rate-limit (429) errors, use `node eval/runEval.js --delay 4000`.
4. Send back the whole folder `server/eval/out/` (zip it). Do NOT edit anything in it.
   It contains `summary.txt`, `results.json`, `env_info.json`, `review_sheet.csv`, `review_key.json`.

## Phase 2 - human labelling (two people, about 2-3 hours each)

`review_sheet.csv` lists profile-scheme pairs, shuffled. Nobody can see which system produced which pair.

* Open it in Excel or Google Sheets (UTF-8, so Hindi/Bengali show correctly).
* Column `assigned_to` says who labels the row: `A`, `B` or `BOTH`.
  Person A fills `label_A` for rows marked A or BOTH. Person B fills `label_B` for rows marked B or BOTH.
  Work **separately** and do not compare until both are finished (the BOTH rows measure agreement).
* Judge only from the profile (`profile_text_english`, `profile_facts`) and the scheme (`scheme_description`,
  `eligibility_rules`; open `official_url` if you are unsure):

  | Label | Meaning |
  |---|---|
  | 2 | The person clearly meets the scheme's requirements and the scheme fits what they need |
  | 1 | They might qualify, but a requirement is not stated in the profile, or the scheme is only loosely relevant |
  | 0 | They clearly do not qualify (fail a stated requirement, wrong state or group) or the scheme is irrelevant |

* Do not use the profile facts that are not written. If the profile doesn't say, it is unknown (label 1, not 2).
* Each person saves their own copy (`labelled_A.csv`, `labelled_B.csv`). Keep it as CSV (UTF-8).

## Phase 3 - score

Put both CSVs next to `eval/out/` and run from `server/`:
```
node eval/scoreEval.js --a labelled_A.csv --b labelled_B.csv
```
* If it lists problems, a label is missing or not 0/1/2 - fix and re-run.
* If A and B disagree on some BOTH rows it writes `eval/out/disagreements.csv`. Discuss each one,
  fill the `final` column, and re-run with `--final eval/out/disagreements.csv`.
* Send back `eval/out/scores.txt` and `eval/out/scores.json`.

## Files

* `testset.json` - 60 profiles (20 per language) with gold answers. `rec: true` marks the 30 used for Phase 2.
* `runEval.js`, `scoreEval.js`, `lib.js` - the scripts.
