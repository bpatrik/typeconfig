// Checks the published package (dist/, built by `npm run build`) through its "exports" map,
// the way consumers load it: require() from CommonJS, import from ES modules and bundling for the browser.
// The package imports itself by name, which Node and esbuild resolve through the "exports" map.
import {createRequire} from 'node:module';
import {strict as assert} from 'node:assert';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const entryPoints = {
  'typeconfig': ['ConfigProperty', 'ConfigDefaults', 'ConfigState', 'SubConfigClass', 'ConstraintError', 'GenericConfigType', 'ConfigMap'],
  'typeconfig/common': ['ConfigProperty', 'ConfigDefaults', 'ConfigState', 'SubConfigClass', 'ConstraintError', 'GenericConfigType', 'ConfigMap'],
  'typeconfig/node': ['ConfigClass', 'ConfigClassBuilder'],
  'typeconfig/web': ['WebConfigClass', 'WebConfigClassBuilder'],
};

// deep imports that PiGallery2 used before the "exports" map existed. They keep working through "./src/*".
const legacyDeepImports = {
  'typeconfig/src/GenericConfigType': ['GenericConfigType'],
  'typeconfig/src/decorators/builders/ConfigClassBuilder': ['ConfigClassBuilder'],
  'typeconfig/src/decorators/builders/WebConfigClassBuilder': ['WebConfigClassBuilder'],
  'typeconfig/src/decorators/class/WebConfigClass': ['WebConfigClass'],
  'typeconfig/src/decorators/class/SubConfigClass': ['SubConfigClass'],
  'typeconfig/src/decorators/property/ConfigPropoerty': ['ConfigProperty'],
  // type only modules
  'typeconfig/src/decorators/class/IConfigClass': [],
  'typeconfig/src/decorators/class/IWebConfigClass': [],
};

/**
 * Applies the decorators the way TypeScript does with experimentalDecorators
 * (and useDefineForClassFields: false), so plain JS can declare a config class.
 */
const declareConfig = ({ConfigProperty, SubConfigClass}, RootDecorator) => {
  class Sub {
    constructor() {
      this.name = 'sub';
    }
  }

  Object.defineProperty(Sub.prototype, 'name', ConfigProperty({type: 'string'})(Sub.prototype, 'name'));
  const SubConfig = SubConfigClass()(Sub);

  class Root {
    constructor() {
      this.num = 5;
      this.sub = new SubConfig();
    }
  }

  Object.defineProperty(Root.prototype, 'num', ConfigProperty({type: 'unsignedInt'})(Root.prototype, 'num'));
  Object.defineProperty(Root.prototype, 'sub', ConfigProperty({type: SubConfig})(Root.prototype, 'sub'));
  return RootDecorator()(Root);
};

const checkWebConfig = (common, web) => {
  const Config = declareConfig(common, web.WebConfigClass);
  const config = new Config();
  config.load({num: '7', sub: {name: 'loaded'}});
  assert.equal(config.num, 7);
  assert.deepEqual(config.toJSON(), {num: 7, sub: {name: 'loaded'}});
  assert.throws(() => {
    config.num = -1;
  });
};

const checkNodeConfig = (common, node) => {
  const Config = declareConfig(common, node.ConfigClass);
  const config = new Config();
  config.loadSync({preventSaving: true});
  assert.deepEqual(config.toJSON(), {num: 5, sub: {name: 'sub'}});
  const clone = config.clone();
  clone.num = 10;
  assert.equal(config.num, 5);
  assert.equal(clone.num, 10);
};

describe('package', () => {

  for (const [specifier, exportNames] of Object.entries({...entryPoints, ...legacyDeepImports})) {
    it(`require('${specifier}') and import('${specifier}') expose the same API`, async () => {
      const cjs = require(specifier);
      const esm = await import(specifier);
      for (const name of exportNames) {
        assert.equal(typeof cjs[name], 'function', `${name} is missing from require('${specifier}')`);
        assert.equal(typeof esm[name], 'function', `${name} is missing from import('${specifier}')`);
      }
      assert.match(require.resolve(specifier), /[\\/]dist[\\/]cjs[\\/]/);
      assert.match(import.meta.resolve(specifier), /\/dist\/esm\//);
    });
  }

  it('keeps the entry points working when imported by file path', () => {
    // e.g. PiGallery2 imports '../../../../node_modules/typeconfig/node', that bypasses the "exports" map
    for (const [entry, exportNames] of [['common', entryPoints['typeconfig/common']], ['node', entryPoints['typeconfig/node']],
      ['web', entryPoints['typeconfig/web']]]) {
      const shim = require(path.join(packageRoot, entry));
      for (const name of exportNames) {
        assert.equal(shim[name], require('typeconfig/' + entry)[name], `${name} is missing from the ${entry} shim`);
      }
    }
  });

  it('works when loaded with require()', () => {
    checkWebConfig(require('typeconfig/common'), require('typeconfig/web'));
    checkNodeConfig(require('typeconfig/common'), require('typeconfig/node'));
  });

  it('works when loaded with import', async () => {
    checkWebConfig(await import('typeconfig/common'), await import('typeconfig/web'));
    checkNodeConfig(await import('typeconfig/common'), await import('typeconfig/node'));
  });

  describe('browser bundle', () => {

    const bundle = (contents) => esbuild.build({
      stdin: {contents, resolveDir: packageRoot, loader: 'js'},
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      metafile: true,
      logLevel: 'silent'
    });

    it('typeconfig/web and typeconfig/common bundle without Node built-ins', async () => {
      const result = await bundle('export * from \'typeconfig/common\'; export * from \'typeconfig/web\';');
      const inputs = Object.keys(result.metafile.inputs).filter((i) => i !== '<stdin>');
      assert.ok(inputs.length > 0);
      for (const input of inputs) {
        assert.match(input, /^dist\/esm\//, `unexpected module in the browser bundle: ${input}`);
      }
    });

    it('typeconfig/node does not bundle for the browser (sanity check of the test above)', async () => {
      await assert.rejects(bundle('export * from \'typeconfig/node\';'), /Could not resolve "(fs|path)"/);
    });
  });
});
