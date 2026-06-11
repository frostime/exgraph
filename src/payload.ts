import path from 'node:path';
import { checkGraphFile } from './check.js';

export async function createGraphPayload(file: string) {
  const result = await checkGraphFile(file);
  return {
    source: path.resolve(file),
    ok: result.ok,
    graph: result.graph ?? null,
    diagnostics: result.diagnostics,
    generated_at: new Date().toISOString(),
  };
}
