---
name: dearcc-jobclaw
description: Read a completed DearCC intake file or pasted answers, derive a short search brief internally, then return a structured job search request as JSON.
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw":{"emoji":"🧭"}}
---

# DearCC dear[CC]

Use this skill for the full DearCC flow in one step:

- read a completed intake file or pasted intake text
- derive a short search brief from the intake
- return a structured JSON job search request for use with any OpenClaw-compatible browser agent

Examples:

- "run dearcc jobclaw on ./my-intake.md"
- "search from this DearCC intake file"
- "run DearCC job search from these five questionnaire answers"

## Accepted Input

Accept either:

- a local file path such as `./intake.md` or `/tmp/dearcc-jobclaw.txt`
- pasted intake text

If the input looks like a readable local file path, read the file before doing anything else.

## Intake Contract

Expect these five core questions in order, with non-empty answers:

1. `It's 5 years from now and you love your work. Describe what you're actually doing on a typical day - not the job title, the actual activities.`
2. `What are you genuinely good at that you never put on your resume or LinkedIn?`
3. `What kind of problem makes you excited to come in on a Monday? Any of these? Hands-on/physical, Research/ideas, Helping people, Data/systems, Something creative, Building a business`
4. `What would make you dread going to work, even if the pay was great?`
5. `A year from now, what would make you feel like you actually moved forward?`

Optional metadata fields may also be present near the top of the file:

- `provider`: the job platform to search (e.g. `linkedin`)
- `location`
- `workMode`: `Any`, `Remote`, `Hybrid`, `On-site`
- `seniority`: `Any`, `Internship`, `Entry level`, `Associate`, `Mid-Senior level`, `Director`, `Executive`
- `minSalary`
- `requireVisaSponsorship`: `true` or `false`
- `preferVolunteerRoles`: `true` or `false`
- `maxResults`
- `riasecOverride`
- `notes`

## Runtime Workflow

1. Read the intake text.
2. If required answers are missing, return:
   - `summary`: a short blocker such as `Missing answers for Q2 and Q4 in the intake file.`
   - `searchRequest`: `null`
3. Derive an internal two-sentence search brief from the intake. Do not print that brief unless the user explicitly asks for it.
   - Sentence 1 should begin with `Search for`.
   - Sentence 2 should be `Return 5 matches as JSON.` unless the intake explicitly asks for a different result count.
4. Infer the search request conservatively from the intake and the internal brief:
   - infer a practical `jobTitle` from the strongest role direction in the intake
   - default `provider` to `linkedin`
   - extract explicit `location`, `workMode`, `seniority`, `minSalary`, and `requireVisaSponsorship` only when present
   - extract 3 to 5 high-signal search terms into the search query
   - extract explicit avoid terms, industries, or work environments into exclusions
   - cap results at `5` by default unless the intake explicitly specifies another `maxResults`
5. Return the structured search request as JSON (see Output Contract below).

## Output Contract

Return JSON with this exact top-level shape:

```json
{
  "summary": "Short description of the candidate's direction and what was inferred from the intake.",
  "searchRequest": {
    "provider": "linkedin",
    "jobTitle": "Inferred role title",
    "keywords": ["keyword1", "keyword2"],
    "exclusions": ["term1", "term2"],
    "location": "City, State or empty string",
    "workMode": "Any",
    "seniority": "Entry level",
    "minSalary": "",
    "requireVisaSponsorship": false,
    "maxResults": 5
  }
}
```

If required answers are missing, return:

```json
{
  "summary": "Missing answers for Q2 and Q4 in the intake file.",
  "searchRequest": null
}
```

## Templates

Starter and example intake files are available under `{baseDir}/templates/`.
