declare module 'cytoscape-dagre';
declare module 'cytoscape-fcose';

declare global {
  interface Window {
    __EXGRAPH_DATA__?: unknown;
  }
}

export {};
