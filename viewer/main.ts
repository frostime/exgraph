import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import fcose from 'cytoscape-fcose';
import './style.css';

cytoscape.use(dagre);
cytoscape.use(fcose);

type Diagnostic = { level: 'error' | 'warning'; code: string; message: string; path?: string };
type NodeData = {
  id: string;
  title: string;
  kind: string;
  state: string;
  note?: string;
  state_note?: string;
  tags: string[];
  sets: string[];
  extra?: Record<string, unknown>;
};
type EdgeData = {
  id: string;
  from: string;
  to: string;
  kind: string;
  label: string;
  note?: string;
  tags: string[];
  extra?: Record<string, unknown>;
};
type Payload = {
  ok: boolean;
  source: string;
  generated_at: string;
  diagnostics: Diagnostic[];
  graph: {
    title: string;
    nodes: NodeData[];
    edges: EdgeData[];
    sets: Record<string, string[]>;
    render: { default_view: 'flow' | 'cluster' | 'frontier'; views: Array<'flow' | 'cluster' | 'frontier'> };
    index: { nodeKinds: string[]; nodeStates: string[]; edgeKinds: string[]; setNames: string[] };
  } | null;
};

const kindColor: Record<string, string> = {
  goal: '#2563eb',
  question: '#0f766e',
  hypothesis: '#7c3aed',
  option: '#8b5cf6',
  attempt: '#ea580c',
  evidence: '#16a34a',
  decision: '#f59e0b',
  artifact: '#0891b2',
  risk: '#dc2626',
  task: '#be123c',
  node: '#64748b',
};

const stateColor: Record<string, string> = {
  seed: '#0f766e',
  candidate: '#7c3aed',
  active: '#2563eb',
  blocked: '#dc2626',
  done: '#16a34a',
  closed: '#6b7280',
  archived: '#6b7280',
};

const edgeColor: Record<string, string> = {
  decomposes_to: '#64748b',
  depends_on: '#64748b',
  supports: '#16a34a',
  refutes: '#dc2626',
  tests: '#0ea5e9',
  blocks: '#f59e0b',
  selects: '#2563eb',
  rejects: '#dc2626',
  supersedes: '#7c3aed',
  produces: '#0891b2',
  relates_to: '#8a95a3',
};

const sansFontStack = 'HarmonyOS Sans SC, HarmonyOS Sans, MiSans, Microsoft YaHei UI, PingFang SC, Noto Sans CJK SC, Source Han Sans SC, system-ui, sans-serif';

let payload: Payload;
let currentLayout: 'flow' | 'cluster' | 'frontier' = 'frontier';
let selectedNodeId: string | null = null;
let cy: cytoscape.Core;

const filters = {
  kind: 'all',
  state: 'all',
  edge: 'all',
  set: 'all',
  search: '',
  hideClosed: false,
};

async function loadPayload(): Promise<Payload> {
  if (window.__EXGRAPH_DATA__) return window.__EXGRAPH_DATA__ as Payload;
  const res = await fetch('/graph.json', { cache: 'no-store' });
  return await res.json() as Payload;
}

async function main() {
  payload = await loadPayload();
  renderDiagnostics(payload.diagnostics);

  if (!payload.graph) {
    document.querySelector('#graph-title')!.textContent = 'ExGraph: invalid graph';
    document.querySelector('#detail')!.innerHTML = '<div class="note">Graph has errors. Fix YAML and rerun check/serve.</div>';
    return;
  }

  document.querySelector('#graph-title')!.textContent = payload.graph.title;
  document.querySelector('#graph-subtitle')!.textContent = `${payload.graph.nodes.length} nodes · ${payload.graph.edges.length} edges · ${payload.source ?? ''}`;
  currentLayout = payload.graph.render.default_view;

  setupControls();
  setupCytoscape();
  setLayout(currentLayout);
  renderDetail(null);
}

function setupControls() {
  const graph = payload.graph!;
  fillSelect('kind-filter', ['all', ...graph.index.nodeKinds]);
  fillSelect('state-filter', ['all', ...graph.index.nodeStates]);
  fillSelect('edge-filter', ['all', ...graph.index.edgeKinds]);
  fillSelect('set-filter', ['all', ...graph.index.setNames]);

  setValue('kind-filter', 'all');
  setValue('state-filter', 'all');
  setValue('edge-filter', 'all');
  setValue('set-filter', 'all');

  document.querySelectorAll<HTMLButtonElement>('button[data-layout]').forEach((button) => {
    button.classList.toggle('active', button.dataset.layout === currentLayout);
    button.addEventListener('click', () => setLayout(button.dataset.layout as typeof currentLayout));
  });

  onChange('kind-filter', (value) => { filters.kind = value; applyFilters(); });
  onChange('state-filter', (value) => { filters.state = value; applyFilters(); });
  onChange('edge-filter', (value) => { filters.edge = value; applyFilters(); });
  onChange('set-filter', (value) => { filters.set = value; applyFilters(); });
  document.querySelector<HTMLInputElement>('#search')!.addEventListener('input', (event) => {
    filters.search = (event.target as HTMLInputElement).value.toLowerCase().trim();
    applyFilters();
  });
  document.querySelector<HTMLInputElement>('#hide-closed')!.addEventListener('change', (event) => {
    filters.hideClosed = (event.target as HTMLInputElement).checked;
    applyFilters();
  });
}

function setupCytoscape() {
  const graph = payload.graph!;
  const pixelRatio = Math.max(2, window.devicePixelRatio || 1);

  cy = cytoscape({
    container: document.getElementById('cy'),
    pixelRatio,
    wheelSensitivity: 0.18,
    elements: [
      ...graph.nodes.map((node) => ({
        group: 'nodes' as const,
        data: {
          ...node,
          label: node.title,
          color: kindColor[node.kind] ?? colorFromString(node.kind),
          stateColor: stateColor[node.state] ?? '#64748b',
          setRank: setRank(node),
        },
      })),
      ...graph.edges.map((edge) => ({
        group: 'edges' as const,
        data: {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          kind: edge.kind,
          label: edge.label,
          note: edge.note,
          tags: edge.tags,
          color: edgeColor[edge.kind] ?? '#8a95a3',
        },
      })),
    ],
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'round-rectangle',
          'background-color': 'data(color)',
          'border-color': 'data(stateColor)',
          'border-width': 4,
          'label': 'data(label)',
          'font-family': sansFontStack,
          'font-size': 13,
          'font-weight': 700,
          'color': '#ffffff',
          'text-wrap': 'wrap',
          'text-max-width': 152,
          'text-valign': 'center',
          'text-halign': 'center',
          'text-outline-width': 0,
          'width': 166,
          'height': 66,
          'padding': 10,
          'overlay-padding': 8,
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'width': 2,
          'opacity': .72,
          'label': 'data(label)',
          'font-family': sansFontStack,
          'font-size': 11,
          'font-weight': 600,
          'text-background-color': '#ffffff',
          'text-background-opacity': .86,
          'text-background-padding': 3,
          'color': '#667085',
        },
      },
      { selector: 'edge[kind = "refutes"], edge[kind = "rejects"]', style: { 'line-style': 'dashed' } },
      { selector: 'edge[kind = "blocks"], edge[kind = "tests"], edge[kind = "supersedes"]', style: { 'line-style': 'dashed' } },
      { selector: '.hidden', style: { 'display': 'none' } },
      { selector: '.dim', style: { 'opacity': .12 } },
      { selector: '.selected', style: { 'border-width': 8, 'border-color': '#f59e0b' } },
      { selector: '.neighbor', style: { 'border-width': 6 } },
    ],
  });

  cy.on('tap', 'node', (event) => {
    const id = event.target.id();
    selectedNodeId = selectedNodeId === id ? null : id;
    updateFocus();
    renderDetail(selectedNodeId);
  });

  cy.on('tap', (event) => {
    if (event.target === cy) {
      selectedNodeId = null;
      updateFocus();
      renderDetail(null);
    }
  });

  applyFilters();
}

function setLayout(layout: 'flow' | 'cluster' | 'frontier') {
  currentLayout = layout;
  document.querySelectorAll<HTMLButtonElement>('button[data-layout]').forEach((button) => {
    button.classList.toggle('active', button.dataset.layout === layout);
  });

  const options = layoutOptions(layout);
  const layoutRun = cy.layout(options as cytoscape.LayoutOptions);

  cy.one('layoutstop', () => {
    applyFilters();
    keepReadableViewport(layout);
  });

  layoutRun.run();
}

function keepReadableViewport(layout: 'flow' | 'cluster' | 'frontier') {
  const visible = cy.elements().not('.hidden');
  if (!visible.length) return;

  cy.minZoom(0.75);
  cy.maxZoom(2.8);

  const padding = layout === 'flow' ? 90 : 70;
  cy.fit(visible, padding);

  const minReadableZoom = layout === 'flow' ? 0.88 : 0.82;
  if (cy.zoom() < minReadableZoom) {
    cy.zoom({
      level: minReadableZoom,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
    cy.center(visible);
  }
}

function layoutOptions(layout: 'flow' | 'cluster' | 'frontier') {
  if (layout === 'flow') {
    return {
      name: 'dagre',
      rankDir: 'LR',
      nodeSep: 60,
      rankSep: 110,
      edgeSep: 20,
      animate: false,
      fit: false,
      padding: 90,
    };
  }
  if (layout === 'cluster') {
    return {
      name: 'fcose',
      animate: false,
      fit: false,
      padding: 80,
      nodeRepulsion: 7200,
      idealEdgeLength: 140,
    };
  }
  return {
    name: 'concentric',
    animate: false,
    fit: false,
    padding: 80,
    minNodeSpacing: 68,
    concentric: (node: cytoscape.NodeSingular) => node.data('setRank'),
    levelWidth: () => 1,
  };
}

function setRank(node: NodeData): number {
  const sets = new Set(node.sets ?? []);
  if (sets.has('mainline')) return 5;
  if (sets.has('frontier')) return 4;
  if (node.state === 'active') return 3;
  if (node.state === 'candidate' || sets.has('parking')) return 2;
  if (node.state === 'closed' || node.state === 'archived' || sets.has('archive')) return 0;
  return 1;
}

function applyFilters() {
  cy.nodes().forEach((ele) => {
    const data = ele.data() as NodeData;
    const hay = [data.id, data.title, data.note, data.state_note, ...(data.tags ?? []), ...(data.sets ?? [])].join(' ').toLowerCase();
    const visible =
      (filters.kind === 'all' || data.kind === filters.kind) &&
      (filters.state === 'all' || data.state === filters.state) &&
      (filters.set === 'all' || (data.sets ?? []).includes(filters.set)) &&
      (!filters.hideClosed || !['closed', 'archived'].includes(data.state)) &&
      (!filters.search || hay.includes(filters.search));
    ele.toggleClass('hidden', !visible);
  });

  cy.edges().forEach((ele) => {
    const visible =
      (filters.edge === 'all' || ele.data('kind') === filters.edge) &&
      !ele.source().hasClass('hidden') &&
      !ele.target().hasClass('hidden');
    ele.toggleClass('hidden', !visible);
  });
  updateFocus();
}

function updateFocus() {
  cy.elements().removeClass('dim selected neighbor');
  if (!selectedNodeId) return;
  const node = cy.getElementById(selectedNodeId);
  node.addClass('selected');
  const neighborhood = node.closedNeighborhood();
  neighborhood.nodes().not(node).addClass('neighbor');
  cy.elements().not(neighborhood).addClass('dim');
}

function renderDiagnostics(diagnostics: Diagnostic[]) {
  const box = document.querySelector('#diagnostics')!;
  if (!diagnostics.length) {
    box.innerHTML = '<div class="note">No diagnostics.</div>';
    return;
  }
  box.innerHTML = diagnostics.map((d) => `
    <div class="diagnostic ${escapeHtml(d.level)}">
      <b>${escapeHtml(d.level.toUpperCase())} · ${escapeHtml(d.code)}</b>
      <small>${escapeHtml(d.path ?? '')}</small>
      <div>${escapeHtml(d.message)}</div>
    </div>
  `).join('');
}

function renderDetail(id: string | null) {
  const graph = payload.graph!;
  const title = document.querySelector('#detail-title')!;
  const detail = document.querySelector('#detail')!;
  if (!id) {
    title.textContent = 'Graph Summary';
    const mainline = cards((graph.sets.mainline ?? []).map((nodeId) => graph.nodes.find((n) => n.id === nodeId)).filter(Boolean) as NodeData[]);
    const frontier = cards((graph.sets.frontier ?? []).map((nodeId) => graph.nodes.find((n) => n.id === nodeId)).filter(Boolean) as NodeData[]);
    detail.innerHTML = `
      <h2>Mainline</h2>${mainline || '—'}
      <h2>Frontier</h2>${frontier || '—'}
      <h2>Sets</h2><div class="pillrow">${Object.keys(graph.sets).map((name) => `<span class="pill">${escapeHtml(name)}</span>`).join('')}</div>
    `;
    return;
  }

  const node = graph.nodes.find((n) => n.id === id)!;
  const incoming = graph.edges.filter((e) => e.to === id);
  const outgoing = graph.edges.filter((e) => e.from === id);
  title.textContent = node.title;
  detail.innerHTML = `
    <h2>Node</h2>
    <div class="kv">
      <div class="k">ID</div><div><code>${escapeHtml(node.id)}</code></div>
      <div class="k">Kind</div><div>${escapeHtml(node.kind)}</div>
      <div class="k">State</div><div>${escapeHtml(node.state)}</div>
      <div class="k">Sets</div><div>${escapeHtml((node.sets ?? []).join(', ') || '—')}</div>
    </div>
    <h2>Note</h2><div class="note">${escapeHtml(node.note ?? '—')}</div>
    <h2>State note</h2><div class="note">${escapeHtml(node.state_note ?? '—')}</div>
    <h2>Tags</h2><div class="pillrow">${(node.tags ?? []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('') || '—'}</div>
    <h2>Incoming</h2>${edgeCards(incoming, graph, 'in') || '—'}
    <h2>Outgoing</h2>${edgeCards(outgoing, graph, 'out') || '—'}
    ${node.extra ? `<h2>Extra</h2><pre>${escapeHtml(JSON.stringify(node.extra, null, 2))}</pre>` : ''}
  `;
}

function cards(nodes: NodeData[]): string {
  return nodes.map((node) => `<div class="mini"><b>${escapeHtml(node.title)}</b><small>${escapeHtml(node.id)} · ${escapeHtml(node.kind)} · ${escapeHtml(node.state)}</small></div>`).join('');
}

function edgeCards(edges: EdgeData[], graph: Payload['graph'], mode: 'in' | 'out'): string {
  return edges.map((edge) => {
    const otherId = mode === 'in' ? edge.from : edge.to;
    const other = graph!.nodes.find((node) => node.id === otherId);
    return `<div class="mini"><b>${escapeHtml(edge.kind)} · ${escapeHtml(other?.title ?? otherId)}</b><small>${escapeHtml(mode === 'in' ? `${edge.from} → this` : `this → ${edge.to}`)} · ${escapeHtml(edge.note ?? edge.label ?? '')}</small></div>`;
  }).join('');
}

function fillSelect(id: string, values: string[]) {
  const select = document.getElementById(id) as HTMLSelectElement;
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}
function setValue(id: string, value: string) {
  (document.getElementById(id) as HTMLSelectElement).value = value;
}
function onChange(id: string, handler: (value: string) => void) {
  document.getElementById(id)!.addEventListener('change', (event) => handler((event.target as HTMLSelectElement).value));
}
function colorFromString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 58%, 48%)`;
}
function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

main().catch((error) => {
  document.body.innerHTML = `<pre>${escapeHtml(String((error as Error).stack ?? error))}</pre>`;
});
