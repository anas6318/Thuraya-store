## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Operating Policy

For substantive multi-file or multi-subsystem tasks, use the orchestrate skill.
For trivial, conversational, lookup, or single-file work, work directly.

Default orchestration policy:

- Prefer the smallest useful plan.
- Hard cap: 4 agent dispatches per orchestrated run, counting every Agent dispatch (workers, verifiers, reviewers, fixes).
- Every orchestrated run MUST initialize with `orchestrate init --cap 4`. Never rely on the planned-slots default; confirm the cap line from `orchestrate plan show` reads `/4` before the first dispatch.
- A different cap requires the user's explicit approval for that specific run; then pass the approved value to `--cap`. Approval does not carry over to later runs.
- When the cap is reached, stop and surface; never raise it mid-run without asking the user.
- Use Graphify first for codebase relationships when useful.
- Agent Skills may be selected automatically when relevant.
- Ponytail guidance is already active; do not invoke extra Ponytail reviews unless they add clear value.
- Use an independent verifier for substantive code-changing work.
- Do not use extra review agents when the verifier already covers the same purpose.
- Never read, print, copy, persist, or expose secrets or .env values unless the user explicitly approves a narrowly scoped need.
- Prefer public/read-only data over privileged credentials.
- No production database writes, destructive migrations, push, merge to main, deploy, DNS/payment changes, or credential changes without explicit user approval.
- Show the routing plan, models, verification plan, and dispatch cap before dispatching agents.
- Avoid orchestration for tasks that do not benefit from it.
- Prefer evidence from tests, source, Graphify, git history, and existing project data over guessing.

## THURAYA Project Rules

- Preserve equal-quality Arabic, Hebrew, and English storefront behavior.
- Preserve RTL for Arabic and Hebrew and LTR for English.
- Preserve ILS pricing and Israel-focused launch behavior unless explicitly asked to change them.
- Do not invent product specifications, certifications, gemstone facts, reviews, stock, or customer data.
- Treat Supabase, payments, authentication, notifications, orders, and customer data as sensitive areas.
- Do not access .env files, service-role credentials, production Supabase, payment providers, or external services without explicit approval.
- Keep unrelated working behavior unchanged; prefer scoped fixes over broad rewrites.
