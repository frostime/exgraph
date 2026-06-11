import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { createGraphPayload } from './payload.js';
import { findViewerRoot } from './paths.js';

export async function exportGraph(file: string, outDir: string): Promise<{ outDir: string; ok: boolean }> {
  const viewerRoot = findViewerRoot();
  const resolvedOutDir = path.resolve(outDir);
  const payload = await createGraphPayload(file);

  await build({
    root: viewerRoot,
    base: './',
    logLevel: 'warn',
    build: {
      outDir: resolvedOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(viewerRoot, 'index.html'),
      },
    },
  });

  await fs.writeFile(path.join(resolvedOutDir, 'graph.json'), JSON.stringify(payload, null, 2), 'utf8');

  const indexPath = path.join(resolvedOutDir, 'index.html');
  const indexHtml = await fs.readFile(indexPath, 'utf8');
  const embeddedScript = `<script>window.__EXGRAPH_DATA__ = ${JSON.stringify(payload)};</script>`;
  const patchedHtml = indexHtml.includes('<!-- EXGRAPH_EMBED -->')
    ? indexHtml.replace('<!-- EXGRAPH_EMBED -->', embeddedScript)
    : indexHtml.replace('</head>', `${embeddedScript}\n</head>`);
  await fs.writeFile(indexPath, patchedHtml, 'utf8');

  return { outDir: resolvedOutDir, ok: payload.ok };
}
