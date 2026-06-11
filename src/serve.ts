import { createServer, type Plugin } from 'vite';
import { createGraphPayload } from './payload.js';
import { findViewerRoot } from './paths.js';

export async function serveGraph(file: string, options: { port?: number; open?: boolean } = {}) {
  const viewerRoot = findViewerRoot();
  const port = options.port ?? 4317;

  const graphPlugin: Plugin = {
    name: 'exgraph-graph-json',
    configureServer(server) {
      server.middlewares.use('/graph.json', async (_req, res) => {
        try {
          const payload = await createGraphPayload(file);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            ok: false,
            graph: null,
            diagnostics: [{
              level: 'error',
              code: 'SERVE_ERROR',
              message: String((error as Error).message ?? error),
            }],
          }));
        }
      });
    },
  };

  const server = await createServer({
    root: viewerRoot,
    plugins: [graphPlugin],
    server: {
      host: '127.0.0.1',
      port,
      open: options.open ?? false,
    },
    clearScreen: false,
  });

  await server.listen();
  server.printUrls();
  return server;
}
