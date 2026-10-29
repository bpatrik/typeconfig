// Compatibility shim for file path imports (e.g. '../node_modules/typeconfig/node'), use 'typeconfig/node' instead.
// A folder instead of a root 'node.js': on Windows cmd.exe would run a root 'node.js' for the bare command 'node'.
'use strict';
module.exports = require('../dist/cjs/node.js');
