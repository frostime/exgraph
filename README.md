# ExGraph v0

ExGraph is a YAML-first exploration graph renderer for Agent-assisted long-running work.

Core formula:

```text
View = render(graph.yaml)
```

Users and Agents edit only YAML. The engine validates, normalizes, renders, and serves views.

## Install / run locally

```bash
pnpm install
pnpm dev check examples/basic.yaml
pnpm dev serve examples/basic.yaml
```

After building:

```bash
pnpm build
node dist/src/cli.js check examples/basic.yaml
node dist/src/cli.js serve examples/basic.yaml
```

## Commands

```bash
exgraph init [file]
exgraph check <file>
exgraph serve <file> [--port 4317]
exgraph export <file> -o <dir>
```

`serve` does not write generated artifacts to the graph workspace. It serves the viewer from package resources and reads `graph.yaml` on demand.

`export` writes static output only when explicitly requested.

## YAML example

```yaml
version: 0.1
title: Example Exploration Graph

nodes:
  - id: g1
    kind: goal
    state: active
    title: 管理长线探索任务状态
    note: 目标是让 User/Agent 能恢复主线、前沿、死节点和关键判断关系。

  - id: h1
    kind: hypothesis
    state: active
    title: YAML-first 图谱可以降低维护成本
    note: User/Agent 只维护 YAML；engine 负责 check、layout、render。
    tags: [mainline, frontier]

edges:
  - from: g1
    to: h1
    kind: supports
    label: 支持

sets:
  mainline: [g1, h1]
  frontier: [h1]

render:
  default_view: frontier
  views: [flow, cluster, frontier]
```

## Design documents

- `spec/PRODUCT_SPEC.md`
- `spec/GRAPH_SCHEMA.md`
- `spec/ENGINE_SPEC.md`
- `spec/VIEW_CONTRACT.md`
- `spec/AGENT_PROTOCOL.md`
- `skills/write-exgraph/SKILL.md`

## License

GPL-3.0. See [LICENSE](LICENSE).
