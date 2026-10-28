// Writes common/node/web .js and .d.ts files to the package root that re-export the CommonJS build.
// Up to 2.3.x the compiled entry points lived in the package root. Imports through the package name
// go through the "exports" map, but imports by file path (e.g. '../node_modules/typeconfig/node') do not.
import {writeFileSync} from 'node:fs';

for (const entry of ['common', 'node', 'web']) {
  const header = '// Compatibility shim for file path imports, use \'typeconfig/' + entry + '\' instead.\n';
  writeFileSync(entry + '.js', header + '\'use strict\';\nmodule.exports = require(\'./dist/cjs/' + entry + '.js\');\n');
  writeFileSync(entry + '.d.ts', header + 'export * from \'./dist/cjs/' + entry + '.js\';\n');
}
