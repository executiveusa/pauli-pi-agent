# Pain Scorecard

## Purpose

The pain scorecard helps PI choose the best software-system opportunity for a business.

The highest-scoring pain point becomes the recommended offer.

## Scoring Fields

Score each field from 1 to 5.

| Field | Meaning |
|---|---|
| Revenue Impact | How directly this pain affects money |
| Frequency | How often the pain happens |
| Owner Stress | How much the owner likely cares |
| Ease of Demo | How easy it is to show a demo |
| Repeatability | Can this be sold to 20+ similar businesses |
| Trust Impact | Does it increase buyer trust |
| Local Advantage | Does Puerto Vallarta/Mexico/local knowledge help |
| Pauli Sent Me Fit | Does it work inside the referral/directory ecosystem |

## Formula

```text
Total Score =
  Revenue Impact
+ Frequency
+ Owner Stress
+ Ease of Demo
+ Repeatability
+ Trust Impact
+ Local Advantage
+ Pauli Sent Me Fit
```

## Score Interpretation

| Range | Action |
|---|---|
| 32–40 | Build immediately. Strong productized niche. |
| 24–31 | Good offer. Build demo before selling. |
| 16–23 | Possible custom project. Validate first. |
| 0–15 | Weak opportunity. Do not prioritize. |

## Output Format

```json
{
  "pain_points": [
    {
      "pain": "No automated follow-up after inquiry",
      "revenue_impact": 5,
      "frequency": 5,
      "owner_stress": 4,
      "ease_of_demo": 5,
      "repeatability": 5,
      "trust_impact": 4,
      "local_advantage": 4,
      "pauli_sent_me_fit": 5,
      "total_score": 37
    }
  ]
}
```
