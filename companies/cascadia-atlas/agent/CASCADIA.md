# CASCADIA — Cascadia Atlas AI Agent

**Backend:** FastAPI Python, port 4700  
**Operator Layer:** Hermes (ops/hermes/SOUL.md persona)  
**Market:** Pacific Northwest, knowledge-intensive organizations  
**Deploy:** Railway (backend) + Vercel (frontend)  

## Product

3D knowledge galaxy built from Markdown notes. Voice I/O.
Every note becomes a node. Every connection becomes an edge.
The galaxy IS the pitch — show, don't tell.

## Routes

- `GET /api/health` — health check
- `POST /api/chat` — converse with the knowledge base
- `POST /api/remember` — add a note to the galaxy
- `GET /api/graph` — return the knowledge graph for 3D visualization

## Content Strategy

The product demos itself. Content = screen recordings of the galaxy,
"look what happened when I added my notes" posts.
LinkedIn + X for "AI for knowledge management" positioning.
PNW aesthetic: mountains, forests, clean minimalism.

## Control Tower

Separate dashboard monitoring all 6 company agents.
Lives at: `companies/cascadia-atlas/control-tower/`
