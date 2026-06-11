export type NodeState =
  | 'seed'
  | 'candidate'
  | 'active'
  | 'blocked'
  | 'done'
  | 'closed'
  | 'archived';

export type ViewName = 'flow' | 'cluster' | 'frontier';

export type DiagnosticLevel = 'error' | 'warning';

export type Diagnostic = {
  level: DiagnosticLevel;
  code: string;
  message: string;
  path?: string;
};

export type ExGraphNode = {
  id: string;
  title: string;
  kind?: string;
  state?: NodeState;
  note?: string;
  state_note?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
};

export type ExGraphEdge = {
  from: string;
  to: string;
  kind?: string;
  label?: string;
  note?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
};

export type RenderConfig = {
  default_view?: ViewName;
  views?: ViewName[];
};

export type ExGraph = {
  version: string | number;
  title: string;
  description?: string;
  created?: string;
  updated?: string;
  nodes: ExGraphNode[];
  edges?: ExGraphEdge[];
  sets?: Record<string, string[]>;
  render?: RenderConfig;
  extra?: Record<string, unknown>;
};

export type NormalizedNode = Required<Pick<ExGraphNode, 'id' | 'title' | 'kind' | 'state' | 'tags'>> & {
  note?: string;
  state_note?: string;
  extra?: Record<string, unknown>;
  sets: string[];
};

export type NormalizedEdge = Required<Pick<ExGraphEdge, 'from' | 'to' | 'kind' | 'label' | 'tags'>> & {
  id: string;
  note?: string;
  extra?: Record<string, unknown>;
};

export type NormalizedGraph = {
  version: string;
  title: string;
  description?: string;
  created?: string;
  updated?: string;
  nodes: NormalizedNode[];
  edges: NormalizedEdge[];
  sets: Record<string, string[]>;
  render: Required<RenderConfig>;
  extra?: Record<string, unknown>;
  index: {
    nodeKinds: string[];
    nodeStates: string[];
    edgeKinds: string[];
    setNames: string[];
  };
};

export type CheckResult = {
  graph?: NormalizedGraph;
  diagnostics: Diagnostic[];
  ok: boolean;
};
