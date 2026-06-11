import type { Diagnostic } from './types.js';

export function formatDiagnostics(diagnostics: Diagnostic[]): string {
  if (!diagnostics.length) return 'No diagnostics.';
  return diagnostics.map((diagnostic) => {
    const loc = diagnostic.path ? ` ${diagnostic.path}` : '';
    return `[${diagnostic.level.toUpperCase()}] ${diagnostic.code}${loc}: ${diagnostic.message}`;
  }).join('\n');
}
