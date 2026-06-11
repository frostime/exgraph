---
name: exgraph-agent
summary: Maintain ExGraph YAML for long-running exploratory work; use the engine for validation and rendering.
---

# ExGraph Agent Skill

Use this skill when helping the user manage long-running exploratory work with ExGraph.

Typical domains:

- Research planning
- Long-form writing
- Product discovery
- Architecture migration
- Multi-branch investigation
- Any project with active paths, dead branches, competing hypotheses, or evolving decisions

## Core posture

Edit only `graph.yaml`. Treat the viewer as generated output.

```text
YAML is source of truth.
View = render(graph.yaml).
```

## What belongs in the graph

Add nodes and edges only when the information affects future judgment:

- goal
- question
- hypothesis / option
- attempt
- evidence
- decision
- artifact
- risk / blocker

Do not record transient chat or low-value notes as graph nodes.

## Field use

Use structured fields only when needed by the engine:

- `id`
- `title`
- `kind`
- `state`
- `tags`
- `sets`
- `edges[].from`
- `edges[].to`
- `edges[].kind`

Use natural language for nuance:

- `note`
- `state_note`
- `edges[].note`

Use `extra` for optional domain-specific data. Do not rely on `extra` for core graph behavior.

## Sets

Prefer sets over custom cursor fields.

Common sets:

```yaml
sets:
  mainline: []
  frontier: []
  parking: []
  archive: []
```

Custom sets are allowed when useful.

## Confirmation rules

Ask the user before:

- Changing the mainline substantially.
- Closing an active node.
- Deleting nodes.
- Turning a hypothesis into a decision.
- Merging or replacing major branches.

Usually safe:

- Add candidate nodes.
- Add evidence/artifact nodes.
- Add supports/refutes/blocks/supersedes edges from clear context.
- Add or refine `state_note`.
- Update frontier when the user is actively working there.

## After editing

Run:

```bash
exgraph check graph.yaml
```

Then report:

- What changed.
- Any errors or warnings.
- The serve URL or export path, if rendered.

Do not dump the full YAML unless requested.
