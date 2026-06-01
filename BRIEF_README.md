# DearCC dear[CC]

Instructions for installing and running `dearcc-jobclaw`.

## Install

After cloning, copy the skill into your OpenClaw workspace:

```bash
mkdir -p ~/.openclaw/workspace/skills
cp -R . ~/.openclaw/workspace/skills/dearcc-jobclaw
```

## Run

Run the skill against the example intake file:

```bash
openclaw agent --local --agent main --message "/skill dearcc-jobclaw $PWD/templates/example-intake.md"
```

## Using Your Own Intake File

Start from the template:

```bash
cp templates/intake.md my-intake.md
```

Fill in the five answers, then run:

```bash
openclaw agent --local --agent main --message "/skill dearcc-jobclaw $PWD/my-intake.md"
```

## Notes

- The skill reads the intake file, derives a short search brief internally, and returns a structured JSON search request.
- The JSON output is designed to be passed to any OpenClaw-compatible browser agent to execute the actual job search.
- Do not use `~` inside the quoted `--message`; use `$PWD/...`, `$HOME/...`, or a full absolute path instead.
- Make sure your main model is at least as good as `minimax-m2.7`. Claude or ChatGPT should be fine.
- If OpenClaw returns an out-of-context error or replays an old result, clear old sessions:

```bash
rm -f ~/.openclaw/agents/main/sessions/*
```

---

Built by [New Work Foundation](https://dearcc.org) · Free, forever.
