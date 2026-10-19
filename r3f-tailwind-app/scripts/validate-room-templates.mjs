import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = fs.readFileSync(path.join(root, 'src/data/furnitureRegistry.js'), 'utf8');
const templates = fs.readFileSync(path.join(root, 'src/data/roomTemplates.js'), 'utf8');
const registeredIds = new Set([...registry.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]));
const referencedIds = [...templates.matchAll(/f\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
const missing = [...new Set(referencedIds.filter((id) => !registeredIds.has(id)))];

if (missing.length > 0) {
  console.error(`Invalid room template furniture IDs: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${referencedIds.length} furniture references against ${registeredIds.size} registry IDs.`);
}
