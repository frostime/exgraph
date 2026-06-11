# ExGraph Product Spec v0

## Positioning

ExGraph is a YAML-first exploration graph renderer for long-running, open-ended work.

It is designed for workflows where an Agent and a user maintain a graph-shaped project state in YAML, and an engine renders that state into views that help the user recover context and manage progress.

```text
View = render(graph.yaml)
```

The YAML file is the single source of truth.

## Primary users

- A user managing long-running exploratory work.
- An Agent maintaining the YAML graph on behalf of the user.
- A local Agent developer integrating graph checking and rendering into a workflow.

## Primary use cases

- Research planning.
- Long-form fiction planning.
- Product discovery.
- Architecture migration.
- Open-ended investigation with dead branches, competing paths, and evolving assumptions.

## Goals

ExGraph should help answer:

1. What is the current mainline?
2. What is the current frontier?
3. What is blocked?
4. Which branches are closed or archived?
5. Which nodes support, refute, block, or supersede others?
6. Why does a node currently have its state?
7. What warnings indicate that the graph is becoming hard to maintain?

## Non-goals

ExGraph v0 does not implement:

- Browser-side graph editing.
- Dragging nodes and saving coordinates.
- Database storage.
- Multi-user collaboration.
- Plugin system.
- Domain-specific ontology profiles.
- AI extraction logic.
- Directory graph composition or imports.
- Persistent layout coordinates.

## Product principle

The tool should not become more complex than the problem it solves.

The user/Agent writes YAML. The engine handles checking, normalization, layout, rendering, and serving.

## Success criteria

v0 is successful when:

1. A user can write a single `graph.yaml`.
2. `exgraph check` reports useful errors and warnings.
3. `exgraph serve graph.yaml` opens a local viewer without polluting the graph workspace.
4. The viewer renders `flow`, `cluster`, and `frontier` views.
5. The user can filter and search the graph.
6. Clicking a node shows incoming and outgoing relationships.
7. Closed branches remain visible but can be hidden.
8. No manual layout coordinates are required.
