// Writes a package.json with the given "type" into a build output folder,
// so Node treats the .js files in it as CommonJS or as ES modules.
// Usage: node scripts/mark-module-type.mjs <dir> <commonjs|module>
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const [dir, type] = process.argv.slice(2);
if (!dir || !['commonjs', 'module'].includes(type)) {
  console.error('Usage: node scripts/mark-module-type.mjs <dir> <commonjs|module>');
  process.exit(1);
}
mkdirSync(dir, {recursive: true});
writeFileSync(join(dir, 'package.json'), JSON.stringify({type}, null, 2) + '\n');
