#!/usr/bin/env node
import { cac } from 'cac';
import { initGraph } from './init.js';
import { checkGraphFile } from './check.js';
import { formatDiagnostics } from './format.js';
import { serveGraph } from './serve.js';
import { exportGraph } from './export.js';

const cli = cac('exgraph');

cli
  .command('init [file]', 'Create a minimal graph.yaml')
  .action(async (file = 'graph.yaml') => {
    try {
      await initGraph(file);
      console.log(`Created ${file}`);
    } catch (error) {
      console.error(`Failed to create ${file}: ${String((error as Error).message ?? error)}`);
      process.exitCode = 1;
    }
  });

cli
  .command('check <file>', 'Validate and lint a graph YAML file')
  .action(async (file: string) => {
    const result = await checkGraphFile(file);
    console.log(formatDiagnostics(result.diagnostics));
    if (result.ok) {
      const nodeCount = result.graph?.nodes.length ?? 0;
      const edgeCount = result.graph?.edges.length ?? 0;
      console.log(`OK: ${nodeCount} nodes, ${edgeCount} edges.`);
    } else {
      process.exitCode = 1;
    }
  });

cli
  .command('serve <file>', 'Serve a local viewer without writing generated files to the graph workspace')
  .option('--port <port>', 'Port number', { default: 4317 })
  .option('--open', 'Open browser')
  .action(async (file: string, options: { port?: string | number; open?: boolean }) => {
    const port = Number(options.port ?? 4317);
    await serveGraph(file, { port, open: options.open });
  });

cli
  .command('export <file>', 'Export a static HTML viewer to an explicit output directory')
  .option('-o, --out <dir>', 'Output directory')
  .action(async (file: string, options: { out?: string }) => {
    if (!options.out) {
      console.error('Missing required option: -o, --out <dir>');
      process.exitCode = 1;
      return;
    }
    const result = await exportGraph(file, options.out);
    console.log(`Exported to ${result.outDir}`);
    if (!result.ok) {
      console.warn('Export completed with graph errors. See diagnostics in graph.json.');
      process.exitCode = 1;
    }
  });

cli.help();
cli.version('0.1.0');
cli.parse();
