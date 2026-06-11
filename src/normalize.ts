import type { ExGraph, NormalizedGraph } from './types.js';

export const DEFAULT_VIEWS = ['flow', 'cluster', 'frontier'] as const;

export function normalizeGraph(graph: ExGraph): NormalizedGraph {
  const edges = graph.edges ?? [];
  const sets = graph.sets ?? {};
  const setMembership = new Map<string, string[]>();

  for (const [setName, ids] of Object.entries(sets)) {
    for (const id of ids) {
      const arr = setMembership.get(id) ?? [];
      arr.push(setName);
      setMembership.set(id, arr);
    }
  }

  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    kind: node.kind ?? 'node',
    state: node.state ?? 'active',
    note: node.note,
    state_note: node.state_note,
    tags: node.tags ?? [],
    extra: node.extra,
    sets: setMembership.get(node.id) ?? [],
  }));

  const normalizedEdges = edges.map((edge, index) => ({
    id: `e${index + 1}:${edge.from}->${edge.to}`,
    from: edge.from,
    to: edge.to,
    kind: edge.kind ?? 'relates_to',
    label: edge.label ?? edge.kind ?? 'relates_to',
    note: edge.note,
    tags: edge.tags ?? [],
    extra: edge.extra,
  }));

  const views = graph.render?.views?.length ? graph.render.views : [...DEFAULT_VIEWS];
  const defaultView = graph.render?.default_view && views.includes(graph.render.default_view)
    ? graph.render.default_view
    : views.includes('frontier')
      ? 'frontier'
      : views[0];

  return {
    version: String(graph.version),
    title: graph.title,
    description: graph.description,
    created: graph.created,
    updated: graph.updated,
    nodes,
    edges: normalizedEdges,
    sets,
    render: {
      default_view: defaultView,
      views,
    },
    extra: graph.extra,
    index: {
      nodeKinds: unique(nodes.map((node) => node.kind)),
      nodeStates: unique(nodes.map((node) => node.state)),
      edgeKinds: unique(normalizedEdges.map((edge) => edge.kind)),
      setNames: unique(Object.keys(sets)),
    },
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
