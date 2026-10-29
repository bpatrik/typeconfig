// Compatibility shim for file path imports (e.g. '../node_modules/typeconfig/common'), use 'typeconfig/common' instead.
// A folder instead of a root 'common.js': on Windows cmd.exe would run a root 'node.js' for the bare command 'node'.
'use strict';
module.exports = require('../dist/cjs/common.js');
