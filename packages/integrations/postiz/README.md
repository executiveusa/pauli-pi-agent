# Postiz Social Media Distribution Adapter

This package connects our Paperclip corporate orchestration plane with **Postiz**, our social publishing execution layer.

## Features
* **Draft Posting**: Dynamically create posts mapped directly to Paperclip tickets.
* **Smart Scheduling**: Set release dates for approved channels.
* **Publishing Governance**: Ensures that posts are automatically routed to dry-run mock queues in sandbox development, preventing any unapproved live posting.

## Sandbox Settings
Ensure `NODE_ENV` is set to `development` or `test` to automatically enable mock queues.

```ts
import { PostizClient } from "./postiz.client";
const client = new PostizClient();
```
