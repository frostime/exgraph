import fs from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { ZodError } from 'zod';
import { exGraphSchema } from './schema.js';
import type { Diagnostic, ExGraph } from './types.js';

export async function readGraphYaml(file: string): Promise<{ graph?: ExGraph; diagnostics: Diagnostic[] }> {
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (error) {
    return {
      diagnostics: [
        {
          level: 'error',
          code: 'READ_FAILED',
          message: `Failed to read file: ${String((error as Error).message ?? error)}`,
        },
      ],
    };
  }

  let data: unknown;
  try {
    data = parseYaml(raw);
  } catch (error) {
    return {
      diagnostics: [
        {
          level: 'error',
          code: 'INVALID_YAML',
          message: `Invalid YAML: ${String((error as Error).message ?? error)}`,
        },
      ],
    };
  }

  try {
    const graph = exGraphSchema.parse(data) as ExGraph;
    return { graph, diagnostics: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        diagnostics: error.issues.map((issue) => ({
          level: 'error',
          code: 'SCHEMA_ERROR',
          message: issue.message,
          path: issue.path.join('.'),
        })),
      };
    }
    return {
      diagnostics: [
        {
          level: 'error',
          code: 'SCHEMA_ERROR',
          message: String((error as Error).message ?? error),
        },
      ],
    };
  }
}
