// Compatibility shim for file path imports (e.g. '../node_modules/typeconfig/web'), use 'typeconfig/web' instead.
// A folder instead of a root 'web.js': on Windows cmd.exe would run a root 'node.js' for the bare command 'node'.
'use strict';
module.exports = require('../dist/cjs/web.js');
