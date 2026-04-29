# JobClaw

AI job-search agent for new graduates — built by [New Work Foundation](https://dearcc.org), a nonprofit committed to keeping this free, forever.

JobClaw reads a short intake questionnaire and derives a structured job search request matched to your actual strengths — not just keywords. Built as an [OpenClaw](https://openclaw.ai) skill.

## What It Does

1. You fill out a five-question intake file about who you are and what you actually want
2. JobClaw derives a search brief from your answers internally
3. It returns a structured JSON search request for use with any OpenClaw-compatible browser agent

## Requirements

- [OpenClaw](https://openclaw.ai) installed
- A compatible browser agent for executing job searches

## Hosted SaaS MVP

This repo also includes a Next.js MVP that wraps the intake in a chat UI and
generates the same structured search request contract from `SKILL.md`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to use the chat intake. The MVP stores progress in
browser local storage and does not run live job-board searches yet. See
`docs/SAAS.md` for the hosting plan, accounts needed, environment variables, and
search-runner options.

## Install

```bash
git clone https://github.com/NewWorkFoundation/jobclaw
mkdir -p ~/.openclaw/workspace/skills
cp -R jobclaw ~/.openclaw/workspace/skills/dearcc-jobclaw
```

## Run

```bash
openclaw agent --local --agent main --message "/skill dearcc-jobclaw $PWD/templates/example-intake.md"
```

See `BRIEF_README.md` for full instructions.

## The Intake

Five questions — no resume required:

1. It's 5 years from now and you love your work. What are you actually doing on a typical day?
2. What are you genuinely good at that you never put on your resume or LinkedIn?
3. What kind of problem makes you excited to come in on a Monday?
4. What would make you dread going to work, even if the pay was great?
5. A year from now, what would make you feel like you actually moved forward?

Optional fields let you filter by location, work mode, seniority, salary, and visa sponsorship.

## License

MIT — see [LICENSE](LICENSE)

---

Built by [New Work Foundation](https://dearcc.org) · Free, forever.
