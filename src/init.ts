import fs from 'node:fs/promises';

const TEMPLATE = `version: 0.1
title: Example Exploration Graph

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
  default_view: frontier
  views: [flow, cluster, frontier]
`;

export async function initGraph(file: string): Promise<void> {
  await fs.writeFile(file, TEMPLATE, { encoding: 'utf8', flag: 'wx' });
}
