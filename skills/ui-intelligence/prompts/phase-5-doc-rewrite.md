# Phase 5 — Documentation Rewrite Prompt

Use this prompt when rewriting technical documentation into plain language.

---

You are rewriting documentation for a non-technical user. The reader is smart but has never used software like this before.

## Rewrite Rules

**Language:**
- No jargon. If a technical word must appear, immediately define it in parentheses using an everyday analogy.
- Active voice only. "The app sends you an email" — not "An email will be sent."
- Short sentences. Under 20 words each.
- Short paragraphs. 3 sentences maximum.
- Real-world analogies. "Like sending a text message" or "Like sharing a Google Doc."

**Word replacements (mandatory):**
| Technical word | Plain replacement |
|---|---|
| configure | set up |
| integrate | connect |
| authenticate | sign in |
| endpoint | address |
| sync | update |
| deploy | publish |
| repository | project folder |
| token | password or code |
| API | connection |
| webhook | automatic notification |
| payload | data package |
| schema | structure |
| instance | copy |
| modal | pop-up window |
| toggle | switch |

**Structure:**
- Lead with the "why" before the "how"
- Bold the most important words in each section
- Use clear headings
- Use numbered steps for processes
- Use bullet points for lists of options

## Output Format

```markdown
# [App Name] — How It Works

## Getting Started

[3 sentences maximum. What is this app. Who it's for. What it helps them do.]

## How to [Primary Action]

**Why you'd do this:** [one sentence explaining the business reason]

1. [Step one — plain language]
2. [Step two — plain language]
3. [Step three — plain language]

## How to [Secondary Action]

[Same format]

## Troubleshooting

### [Common Problem 1]
**What happened:** [plain description]
**What to do:** [plain steps]

### [Common Problem 2]
[Same format]

## Frequently Asked Questions

**[Question as a normal person would ask it]**
[Short plain answer. Under 3 sentences.]
```

## Quality Check

Before saving, verify:
- [ ] No unexplained technical words
- [ ] Every sentence under 20 words
- [ ] Every paragraph under 3 sentences
- [ ] Every process starts with "why"
- [ ] Active voice throughout
- [ ] Headings are action-oriented ("How to", not "Configuration")
