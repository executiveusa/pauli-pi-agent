# Skill - Postiz Social Distribution

This skill outlines how the Postiz Distribution Agent schedules content calendar releases in accordance with the brand policies.

## Procedures

### 1. Daily Queue Checks (`daily-postiz-queue`)
* At 15:00 America/Mexico_City, compile the UGC draft scripts.
* Trigger `PostizClient.createDraftPost` for each scheduled release.
* Map draft IDs to Paperclip campaign tracking tickets.

### 2. Live Publishing Governance
* Live publishing requires explicit approval by Bambu.
* Posts that are approved are released by the scheduler:
  ```ts
  const scheduler = new PostizScheduler();
  const scheduled = await scheduler.queueApprovedPosts(approvedList);
  ```
* Any outbound platform failures or OAuth expiration metrics are logged in the daily metrics table.
