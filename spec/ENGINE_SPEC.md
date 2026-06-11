# ExGraph Engine Spec v0

## Command model

ExGraph v0 exposes four commands:

```bash
exgraph init [file]
exgraph check <file>
exgraph serve <file> [--port 4317]
exgraph export <file> -o <dir>
```

## Workspace pollution policy

`serve` and `check` must not write generated artifacts to the graph workspace.

If temporary files are required, they should be written to the operating system temp directory or package-managed cache locations.

`export` writes only to the explicit output directory.

## init

Creates a minimal `graph.yaml`.

## check

Pipeline:

```text
read YAML → parse → schema validate → normalize → semantic lint → diagnostics
```

### Hard errors

- Invalid YAML.
- Missing top-level `version`.
- Missing top-level `title`.
- Missing `nodes`.
- Duplicate node id.
- Node missing `id`.
- Node missing `title`.
- Edge references missing node.
- Set references missing node.
- Invalid state.

### Warnings

- `closed` node without `state_note`.
- `blocked` node without `state_note` and without incoming `blocks` or `depends_on` edge.
- Missing `mainline` set.
- Missing `frontier` set.
- Frontier set too large.
- Too many orphan nodes.
- Too many `relates_to` edges.
- Edge has no kind.
- Active node not in any set.

Warnings do not block rendering.

## serve

`exgraph serve graph.yaml` starts a local viewer.

Behavior:

- Does not write output to the graph workspace.
- Reads and parses `graph.yaml` on demand.
- Provides `/graph.json` as normalized graph plus diagnostics.
- Viewer refetches when the page loads; live reload can be added by Vite or polling.

## export

`exgraph export graph.yaml -o dist` creates a static HTML viewer.

Behavior:

- Explicitly writes to `dist` or the provided directory.
- Embeds normalized graph data into the viewer HTML so it can be opened directly.
- May also write `graph.json` for inspection.

## Normalized graph model

The viewer consumes normalized JSON, not raw YAML.

Normalized data should include:

- `graph.title`
- normalized nodes
- normalized edges
- normalized sets
- diagnostics
- per-node set membership
- distinct node kinds, states, edge kinds, and set names for filter controls
