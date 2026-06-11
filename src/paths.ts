import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function findViewerRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../viewer'),
    path.resolve(here, '../../viewer'),
    path.resolve(process.cwd(), 'viewer'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) return candidate;
  }
  throw new Error(`Cannot locate viewer/index.html. Tried: ${candidates.join(', ')}`);
}
