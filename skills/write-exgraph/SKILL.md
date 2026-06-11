---
name: exgraph
summary: Build and maintain exploration graphs for long-running, open-ended work. Use when the user is managing research, writing, product discovery, or any multi-path investigation.
---

# ExGraph Skill

Use this skill when the user is doing long-running, open-ended work that involves multiple paths, hypotheses, dead branches, or evolving goals.

## When to use

Trigger this skill when:

- User is planning research, thesis, or multi-paper work
- User is writing a long-form novel, screenplay, or world-building
- User is exploring product opportunities, validating assumptions
- User is migrating architecture, evaluating technical options
- User mentions "keeping track of branches", "dead ends", "what was I doing", "which path am I on"
- User has been working on something for days/weeks and needs to recover context

Do NOT use for:

- Simple task lists
- Linear execution with clear steps
- One-shot conversations

## How to confirm the need

If unsure, ask:

> "This sounds like an exploratory project with multiple paths. Want me to set up an exploration graph to track the state?"

## Core workflow

```
1. Understand the user's situation
2. Confirm or create graph.yaml
3. Build/update nodes, edges, sets
4. Guide user to view with CLI
```

## Starting a new graph

If no graph exists, use the `exgraph init` command:

```bash
exgraph init demo.graph.yaml
```

This creates a basic graph with the following structure:

```yaml
version: 0.1
title: Example Exploration Graph
description: A brief description of this exploration graph
created: 2026-06-11
updated: 2026-06-11

nodes:
  - id: g1
    kind: goal
    state: active
    title: 管理长线探索任务状态
    note: 目标是让 User/Agent 能恢复主线、前沿、死节点和关键判断关系。
    tags: [mainline]

  - id: h1
    kind: hypothesis
    state: active
    title: YAML-first 图谱可以降低维护成本
    note: User/Agent 只维护 YAML；engine 负责 check、layout、render。
    tags: [frontier]

  - id: h2
    kind: option
    state: closed
    title: 做复杂图上编辑器
    state_note: >
      关闭原因：图上编辑过重，违背低负担使用模式。
      可复用：focus、filter、path highlight 这些查看交互。
      重开条件：后续发现 YAML 编辑无法承载真实使用场景。

edges:
  - from: g1
    to: h1
    kind: supports
    label: 支持

  - from: h2
    to: h1
    kind: supersedes
    label: 被替代

sets:
  mainline: [g1, h1]
  frontier: [h1]
  archive: [h2]

render:
  default_view: flow
  views: [flow, cluster, frontier]
```

Then ask the user:

> "I've initialized a basic graph. What's the current main goal? What paths are you exploring?"

## Building the graph

### Node patterns

Add nodes when information affects future judgment:

| Situation | Node kind | Example |
|-----------|-----------|---------|
| User has a goal | `goal` | "完成论文主线" |
| User asks a question | `question` | "这个方向有 novelty 吗？" |
| User proposes a path | `hypothesis` or `option` | "多事件耦合可能改进检测" |
| User tries something | `attempt` | "跑了一个 pilot 实验" |
| User finds evidence | `evidence` | "文献显示已有方法成熟" |
| User makes a choice | `decision` | "选择路线 A 而非 B" |
| User produces output | `artifact` | "文献综述初稿" |
| User identifies a blocker | `risk` | "数据量不足" |

### Edge patterns

Connect nodes to show relationships:

| Relationship | Edge kind | Direction |
|--------------|-----------|-----------|
| Evidence supports hypothesis | `supports` | evidence → hypothesis |
| Evidence weakens hypothesis | `refutes` | evidence → hypothesis |
| Path A replaces path B | `supersedes` | old → new |
| Blocker prevents progress | `blocks` | risk → blocked node |
| Goal breaks into sub-problems | `decomposes_to` | goal → question |
| Experiment tests hypothesis | `tests` | attempt → hypothesis |
| Decision selects option | `selects` | decision → option |
| Decision rejects option | `rejects` | decision → option |

### Sets

Use sets to track work focus:

```yaml
sets:
  mainline: [g1, q1, h1, d1]    # Current believed path
  frontier: [h1, a1]             # Active exploration area
  parking: [h2]                  # Valuable but paused
  archive: [h3]                  # Closed, preserved for reference
```

Custom sets are fine for routes, phases, themes:

```yaml
sets:
  route-a: [h1, a1, e2]
  chapter-2: [scene3, scene4]
  experiment-batch-1: [e1, e2, e3]
```

## Updating the graph

When user shares new information:

1. **Identify what's durable** — not every chat message becomes a node
2. **Add nodes** for new goals, questions, hypotheses, evidence, decisions
3. **Add edges** to connect new nodes to existing graph
4. **Update sets** when focus shifts
5. **Update state** when status changes

### State transitions

```
seed → candidate → active → done
                   ↓
                blocked → active
                   ↓
                closed
                   ↓
                archived
```

For `blocked` or `closed` nodes, add `state_note` explaining why:

```yaml
- id: h2
  kind: option
  state: closed
  title: 双曲图嵌入作为主线
  state_note: >
    关闭原因：与当前数据和毕业时间线耦合弱。
    可复用：层级结构分析思路。
    重开条件：发现脑网络层级结构与事件检测强相关。
```

## Confirming with user

Ask before:

- Closing an active node
- Changing mainline significantly
- Deleting nodes
- Converting hypothesis to decision

Usually safe to do directly:

- Adding new candidate/evidence nodes
- Adding edges from clear context
- Updating frontier set
- Adding state_note

## Guiding user to view

After updating the graph, tell user what changed and suggest viewing:

```
已更新图谱：
- 新增节点：h3（候选路线 C）
- 新增边：e2 → h3（supports）
- frontier 更新：[h1, h3]

查看方式：
  pnpm dev serve graph.yaml

或导出静态页面：
  pnpm dev export graph.yaml -o /tmp/exgraph-export
```

If user doesn't have CLI set up, remind them:

> "ExGraph 需要 CLI 来渲染视图。你可以在项目目录运行 `pnpm install` 然后 `pnpm dev serve graph.yaml` 来查看。"

## Reporting changes

After editing, summarize:

- Nodes added/removed/changed
- Edges added
- Sets changed
- State transitions
- Any warnings from `exgraph check`

Do NOT dump the full YAML unless asked.

## Common patterns

### Research planning

```yaml
nodes:
  - id: g1
    kind: goal
    state: active
    title: 形成可毕业的论文主线

  - id: q1
    kind: question
    state: active
    title: 哪个方向有足够的 novelty？

  - id: h1
    kind: hypothesis
    state: active
    title: 多事件耦合可改进微结构识别

  - id: h2
    kind: hypothesis
    state: closed
    title: 表征学习作为主线
    state_note: 跨度大，与当前数据耦合弱。

edges:
  - from: g1
    to: q1
    kind: decomposes_to
  - from: q1
    to: h1
    kind: tests
  - from: h2
    to: h1
    kind: supersedes

sets:
  mainline: [g1, q1, h1]
  frontier: [h1]
  archive: [h2]
```

### Fiction writing

```yaml
nodes:
  - id: g1
    kind: goal
    state: active
    title: 完成长篇小说主线

  - id: o1
    kind: option
    state: closed
    title: 女主早期背叛主角
    state_note: >
      破坏后续人物信任弧线。
      可复用：背叛误会场景可改成第三方栽赃。

  - id: o2
    kind: option
    state: active
    title: 第三方栽赃导致信任危机

edges:
  - from: o1
    to: o2
    kind: supersedes

sets:
  mainline: [g1, o2]
  archive: [o1]
```

## Anti-patterns

Avoid:

- Turning every thought into a node (only durable information)
- Using `relates_to` for everything (use specific edge kinds)
- Closing branches without `state_note`
- Adding layout coordinates (engine handles this)
- Editing generated viewer files (only edit YAML)
- Dumping full YAML as summary
