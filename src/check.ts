import type { CheckResult, Diagnostic, ExGraph } from './types.js';
import { normalizeGraph } from './normalize.js';
import { readGraphYaml } from './parse.js';

const FRONTIER_SOFT_LIMIT = 12;
const ORPHAN_SOFT_LIMIT = 8;
const RELATES_TO_RATIO_LIMIT = 0.35;

export async function checkGraphFile(file: string): Promise<CheckResult> {
  const parsed = await readGraphYaml(file);
  if (!parsed.graph) {
    return { ok: false, diagnostics: parsed.diagnostics };
  }
  return checkGraph(parsed.graph, parsed.diagnostics);
}

export function checkGraph(graph: ExGraph, initialDiagnostics: Diagnostic[] = []): CheckResult {
  const diagnostics: Diagnostic[] = [...initialDiagnostics];
  const nodeIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const [index, node] of graph.nodes.entries()) {
    if (nodeIds.has(node.id)) duplicateIds.add(node.id);
    nodeIds.add(node.id);
    if (node.state === 'closed' && !node.state_note?.trim()) {
      diagnostics.push({
        level: 'warning',
        code: 'CLOSED_WITHOUT_STATE_NOTE',
        message: `Closed node '${node.id}' should explain why in state_note.`,
        path: `nodes.${index}.state_note`,
      });
    }
  }

  for (const id of duplicateIds) {
    diagnostics.push({
      level: 'error',
      code: 'DUPLICATE_NODE_ID',
      message: `Duplicate node id: ${id}`,
    });
  }

  for (const [index, edge] of (graph.edges ?? []).entries()) {
    if (!nodeIds.has(edge.from)) {
      diagnostics.push({
        level: 'error',
        code: 'EDGE_FROM_MISSING_NODE',
        message: `Edge ${index} references missing source node '${edge.from}'.`,
        path: `edges.${index}.from`,
      });
    }
    if (!nodeIds.has(edge.to)) {
      diagnostics.push({
        level: 'error',
        code: 'EDGE_TO_MISSING_NODE',
        message: `Edge ${index} references missing target node '${edge.to}'.`,
        path: `edges.${index}.to`,
      });
    }
    if (!edge.kind) {
      diagnostics.push({
        level: 'warning',
        code: 'EDGE_WITHOUT_KIND',
        message: `Edge ${index} has no kind; consider using a semantic kind instead of an implicit relation.`,
        path: `edges.${index}.kind`,
      });
    }
  }

  for (const [setName, ids] of Object.entries(graph.sets ?? {})) {
    for (const [index, id] of ids.entries()) {
      if (!nodeIds.has(id)) {
        diagnostics.push({
          level: 'error',
          code: 'SET_REFERENCES_MISSING_NODE',
          message: `Set '${setName}' references missing node '${id}'.`,
          path: `sets.${setName}.${index}`,
        });
      }
    }
  }

  if (!graph.sets?.mainline?.length) {
    diagnostics.push({
      level: 'warning',
      code: 'MISSING_MAINLINE_SET',
      message: `Missing or empty sets.mainline. Users may not be able to identify the current mainline.`,
      path: 'sets.mainline',
    });
  }

  if (!graph.sets?.frontier?.length) {
    diagnostics.push({
      level: 'warning',
      code: 'MISSING_FRONTIER_SET',
      message: `Missing or empty sets.frontier. Users may not be able to identify current work frontiers.`,
      path: 'sets.frontier',
    });
  } else if (graph.sets.frontier.length > FRONTIER_SOFT_LIMIT) {
    diagnostics.push({
      level: 'warning',
      code: 'FRONTIER_TOO_LARGE',
      message: `sets.frontier has ${graph.sets.frontier.length} nodes; consider narrowing the current work focus.`,
      path: 'sets.frontier',
    });
  }

  const incomingByNode = new Map<string, string[]>();
  const outgoingByNode = new Map<string, string[]>();
  for (const node of graph.nodes) {
    incomingByNode.set(node.id, []);
    outgoingByNode.set(node.id, []);
  }
  for (const edge of graph.edges ?? []) {
    incomingByNode.get(edge.to)?.push(edge.kind ?? 'relates_to');
    outgoingByNode.get(edge.from)?.push(edge.kind ?? 'relates_to');
  }

  const orphanIds = graph.nodes
    .filter((node) => !(incomingByNode.get(node.id)?.length) && !(outgoingByNode.get(node.id)?.length))
    .map((node) => node.id);
  if (orphanIds.length > ORPHAN_SOFT_LIMIT) {
    diagnostics.push({
      level: 'warning',
      code: 'TOO_MANY_ORPHANS',
      message: `Graph has ${orphanIds.length} orphan nodes. Orphans can be useful, but too many reduce graph readability.`,
    });
  }

  for (const node of graph.nodes) {
    const incoming = incomingByNode.get(node.id) ?? [];
    if (node.state === 'blocked' && !node.state_note?.trim() && !incoming.some((kind) => kind === 'blocks' || kind === 'depends_on')) {
      diagnostics.push({
        level: 'warning',
        code: 'BLOCKED_WITHOUT_REASON',
        message: `Blocked node '${node.id}' should have state_note or an incoming blocks/depends_on edge.`,
      });
    }
  }

  const allSetMembers = new Set(Object.values(graph.sets ?? {}).flat());
  for (const node of graph.nodes) {
    if (node.state === 'active' && !allSetMembers.has(node.id)) {
      diagnostics.push({
        level: 'warning',
        code: 'ACTIVE_NODE_NOT_IN_ANY_SET',
        message: `Active node '${node.id}' is not in any set. Consider adding it to mainline, frontier, parking, archive, or a custom set.`,
      });
    }
  }

  const edges = graph.edges ?? [];
  if (edges.length > 0) {
    const relatesCount = edges.filter((edge) => (edge.kind ?? 'relates_to') === 'relates_to').length;
    if (relatesCount / edges.length > RELATES_TO_RATIO_LIMIT) {
      diagnostics.push({
        level: 'warning',
        code: 'TOO_MANY_RELATES_TO_EDGES',
        message: `${relatesCount}/${edges.length} edges are relates_to. Consider using more specific edge kinds.`,
      });
    }
  }

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.level === 'error');
  return {
    ok: !hasErrors,
    graph: hasErrors ? undefined : normalizeGraph(graph),
    diagnostics,
  };
}
