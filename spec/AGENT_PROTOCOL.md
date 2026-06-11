# ExGraph Agent Protocol v0

## Purpose

This protocol tells Agents how to maintain `graph.yaml` without polluting the graph or over-structuring long-running work state.

## Core rule

Agents edit YAML only. Agents do not edit generated viewer files.

```text
User/Agent updates graph.yaml → exgraph check → exgraph serve/export
```

## What to add

Add durable nodes and edges when they affect future judgment:

- A stable goal.
- A key question.
- A hypothesis or option.
- A meaningful attempt or experiment.
- Evidence or observation.
- A decision.
- A risk/blocker.
- An artifact that carries future context.

Do not add transient conversation noise.

## How to use natural language fields

Prefer `note` and `state_note` for nuanced information.

Do not split nuanced information into structured fields unless the engine needs to parse it.

Use `extra` only for optional domain-specific data.

## State changes requiring user confirmation

Ask before:

- Changing `sets.mainline` substantially.
- Closing an `active` node.
- Deleting nodes.
- Converting a hypothesis into a decision.
- Merging or replacing major routes.

## State changes usually safe to propose or perform

- Adding a candidate node.
- Adding evidence or artifact nodes.
- Adding `supports`, `refutes`, `blocks`, or `supersedes` edges based on clear conversation context.
- Updating `sets.frontier` when the user is actively discussing that focus.
- Adding `state_note` to explain a blocked/closed state.

## Reporting after edits

After editing YAML, the Agent should report:

- Added nodes.
- Added edges.
- Changed sets.
- Changed node states.
- Diagnostics from `exgraph check`.
- Viewer URL or export path.

Avoid dumping the entire YAML unless the user asks.

## Anti-patterns

- Turning every thought into a node.
- Overusing `relates_to`.
- Closing a branch without `state_note`.
- Making `extra` required for core behavior.
- Adding layout coordinates.
- Editing generated HTML instead of YAML.
