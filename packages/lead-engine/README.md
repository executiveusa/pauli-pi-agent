# Lead Engine Package

This package manages our automated B2B lead discovery and prospecting pipelines.

## CLI Usage
Configure your local environment keys first before executing commands.

```bash
# Find and compile leads
pi-agency leads find --niche "med spa" --location "Mexico City" --limit 25

# Score active prospects
pi-agency leads score

# Generate sales briefs
pi-agency leads brief

# Export to CRM
pi-agency leads export
```

## Lead Criteria
* Website is broken, static, or completely missing.
* Google review volume is between 15 and 350 reviews.
* Outbound emails require explicit human approval before live mailing.
