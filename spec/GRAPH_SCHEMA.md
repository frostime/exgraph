# ExGraph Graph Schema v0

## Design logic

The graph is consumed by humans and Agents for long-running work management, not by a traditional business application.

Fields are divided into three categories:

1. Engine-structured fields: required for parsing, checking, layout, filtering, and rendering.
2. User/Agent semantic fields: valuable for recovering context and understanding state.
3. Extension fields: optional escape hatches that v0 does not interpret.

Fields should be structured only when the engine needs them or when structured form clearly improves long-term use. Otherwise natural-language fields are preferred because they are easier for users and Agents to maintain correctly.

## Top-level shape

```yaml
version: 0.1
title: Example Exploration Graph
nodes: []
edges: []
sets: {}
render:
  default_view: frontier
  views: [flow, cluster, frontier]
extra: {}
```

Required:

- `version`
- `title`
- `nodes`

Optional:

- `edges`
- `sets`
- `render`
- `extra`

## Node

```yaml
- id: h1
  kind: hypothesis
  state: active
  title: YAML-first graph can reduce recovery cost
  note: User/Agent only edits YAML; engine checks and renders.
  state_note: Current state explanation, especially for blocked/closed nodes.
  tags: [frontier]
  extra:
    confidence: 0.65
```

Required:

- `id`
- `title`

Optional:

- `kind`
- `state`
- `note`
- `state_note`
- `tags`
- `extra`

### `kind`

`kind` is open-ended. The engine may provide default styles for common values but must allow unknown values.

Recommended generic kinds:

- `goal`
- `question`
- `hypothesis`
- `option`
- `attempt`
- `evidence`
- `decision`
- `artifact`
- `risk`
- `task`

### `state`

Allowed states:

- `seed`
- `candidate`
- `active`
- `blocked`
- `done`
- `closed`
- `archived`

State is a project management state, not a full logical truth value.

Use edges such as `supports`, `refutes`, and `supersedes` to express logical relations.

### `note`

Long-lived natural-language explanation of the node.

### `state_note`

Natural-language explanation for the current state.

Recommended for:

- `blocked`
- `closed`
- `archived`

Example:

```yaml
state: closed
state_note: >
  关闭原因：图上编辑器过重，违背低负担使用模式。
  可复用：focus/filter 交互。
  重开条件：发现 YAML 编辑无法承载真实使用。
```

### `extra`

`extra` is a user/Agent extension escape hatch.

Rules:

- Engine v0 does not depend on `extra`.
- Viewer may display `extra`, but must not require it.
- Lint must not use `extra` for core judgments.
- Domain-specific information should prefer `extra` over expanding the core schema.

## Edge

```yaml
- from: e1
  to: h1
  kind: supports
  label: supports
  note: Evidence e1 supports hypothesis h1 because ...
  tags: [rationale]
  extra:
    source: literature-review
```

Required:

- `from`
- `to`

Optional:

- `kind`
- `label`
- `note`
- `tags`
- `extra`

### Recognized edge kinds

- `decomposes_to`
- `depends_on`
- `supports`
- `refutes`
- `tests`
- `blocks`
- `selects`
- `rejects`
- `supersedes`
- `produces`
- `relates_to`

Unknown edge kinds are allowed and rendered generically.

## Sets

`sets` are named node collections.

```yaml
sets:
  mainline: [g1, q1, h1]
  frontier: [h1, a1, r1]
  parking: [h2]
  archive: [h3]
  route-a: [h1, a1, e2]
```

Recognized set names:

- `mainline`
- `frontier`
- `parking`
- `archive`

Custom set names are allowed and should be exposed as filters/highlights.

## Render config

```yaml
render:
  default_view: frontier
  views: [flow, cluster, frontier]
```

Allowed views:

- `flow`
- `cluster`
- `frontier`

Render config is an engine hint, not graph semantics.

## Imports

Imports are reserved for v1 and not implemented in v0.

Future syntax:

```yaml
imports:
  - path: ./subgraphs/research.yaml
    namespace: research
```
