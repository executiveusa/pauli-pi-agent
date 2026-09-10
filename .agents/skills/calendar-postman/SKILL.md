---
name: calendar-postman
description: Use connected Google Calendar capabilities for agenda intelligence, meeting preparation, deadlines and explicit scheduling while reporting real connection state.
---

# Calendar Postman

## Scope
Read calendars/events, prepare meeting context, detect conflicts, extract deadlines, and create/update events only when the user requested the write.

## Rules
- Verify connector state first.
- Use explicit timezones and preserve original event IDs.
- Check availability before scheduling when needed.
- Do not fabricate events or availability.
- Creating, updating, deleting, or responding to invitations is an external write and must follow the user's explicit instruction/approval policy.
- Keep private attendee/event data out of public publishing.
- Never persist OAuth tokens to Second Brain.

## Output
Agenda/context, proposed event, or verified Calendar receipt.