---
name: shockwave-obsidian-graph-operator
description: "Operates the Shockwave workspace as an Obsidian-style graph knowledge base. Use when the user asks to map connections between notes, find orphaned notes, build a knowledge graph, trace backlinks, find all references to a topic, suggest missing links, or audit the second-brain structure. Trigger phrases: graph, backlinks, orphaned notes, knowledge map, connect notes, wiki-links audit, second brain structure, find connections."
---

# Shockwave Obsidian Graph Operator

Operates the Pi Agent second-brain as a connected graph of markdown notes.

## When to use

- User asks to "map" or "graph" their notes
- User asks to find all notes related to a topic
- User asks to find orphaned notes (no links in or out)
- User asks to audit wiki-link coverage
- User asks to suggest missing connections
- User asks to build or update a registry/map note

## Graph traversal procedure

1. List all `.md` files: `find . -name "*.md" | sort`
2. Extract outgoing links from a file: `grep -oP '\[\[([^\]#|]+)' <file> | sed 's/\[\[//'`
3. Find backlinks to a note: `grep -rln '\[\[<Basename>' .`
4. Two-hop traversal is usually sufficient for context.

## Orphan detection

```bash
# List files with no outgoing wiki-links
for f in $(find . -name "*.md"); do
  count=$(grep -oP '\[\[' "$f" | wc -l)
  if [ "$count" -eq 0 ]; then echo "$f"; fi
done
```

## Missing link suggestion

When reviewing a note:
1. Extract key nouns and proper names.
2. Check if any match an existing basename: `find . -iname '<name>.md'`
3. If a match exists and no link is present, suggest adding `[[Basename]]`.
4. If no match exists and the topic is important, propose creating the note.

## Registry maintenance

`_registry/Repository Company Registry.md` is the master index of all companies, projects, and repositories. When a new company or project appears in conversation:
1. Check if it's already in the registry.
2. If not, append an entry with wiki-link to any existing detail note.
3. Create a detail note under `_registry/<Company Name>.md` if substantial info exists.

## Graph health report format

```markdown
# Graph Health — <date>

## Summary
- Total notes: N
- Notes with outgoing links: N
- Notes with backlinks: N
- Orphaned notes (no links either direction): N

## Orphaned notes
- [[Note A]]
- [[Note B]]

## Suggested connections
- [[Note X]] → [[Note Y]] (shared topic: <topic>)
```

[[Emerald Tablets Prime Directive]]
[[Pi Agent Operating Map]]
