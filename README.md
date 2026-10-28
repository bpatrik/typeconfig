# typeconfig
[![npm version](https://badge.fury.io/js/typeconfig.svg)](https://badge.fury.io/js/typeconfig)
[![test](https://github.com/bpatrik/typeconfig/actions/workflows/build.yml/badge.svg)](https://github.com/bpatrik/typeconfig/actions/workflows/build.yml)

Configuration file for Typescript.
Useful for separating frontend (public) and backend (private) config
Features:
 - Creating Configuration in Typescript file with types
 - Loading configuration from file, command line arguments, environmental variables
 - Support config file hierarchy

# Install

```shell
npm install typeconfig
```

The package ships both ES modules and CommonJS (with typings for both), and has three entry points:

| Entry point         | Content                                                                              |
|---------------------|--------------------------------------------------------------------------------------|
| `typeconfig/common` | `ConfigProperty`, `SubConfigClass`, `ConfigMap`, `GenericConfigType`, the interfaces |
| `typeconfig/node`   | `ConfigClass`, `ConfigClassBuilder` (loads and saves files, reads cli and env)        |
| `typeconfig/web`    | `WebConfigClass`, `WebConfigClassBuilder` (for the browser, no Node built-ins)        |

`typeconfig/common` and `typeconfig/web` can be bundled for the browser.

Deep imports (`typeconfig/src/...`) still work, but they are deprecated. Import from the entry points above instead.

## TypeScript setup

The config classes use (legacy) decorators. Set these in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false
  }
}
```

`useDefineForClassFields: false` is required (it defaults to `true` from target `ES2022`):
otherwise the class fields shadow the getters and setters that `@ConfigProperty` installs.

If a property has no `type` option, it is inferred from the decorator metadata (`design:type`).
This needs `emitDecoratorMetadata` and the `reflect-metadata` polyfill, imported before the config classes:

```typescript
import 'reflect-metadata';
```

If every `@ConfigProperty` has an explicit `type` (and `arrayType` for arrays), neither is needed.

# Usage

```typescript
import {ConfigProperty, SubConfigClass} from 'typeconfig/common';
import {ConfigClass, ConfigClassBuilder} from 'typeconfig/node';

@SubConfigClass()
class S {

  @ConfigProperty({envAlias: 'numAlias'})
  num: number = 5;

  @ConfigProperty({
    type: 'ratio',
    onNewValue: (v, c: C) => {
      c.temperature = v * 100;
    }
  })
  temperatureRatio: number = 0.2;

}

@ConfigClass({configPath: './config.json'})
class C {

  @ConfigProperty()
  sub: S = new S();

  @ConfigProperty({type: 'integer'})
  num: number = 5;

  @ConfigProperty({type: 'integer', constraint: {assert: v => v < 100 && v > 0}})
  temperature: number = 5;

}

export const Config = ConfigClassBuilder.attachInterface(new C());
Config.loadSync();
```

# Legacy usage

Legacy usage is still supported and can be accessed like the following way:

### backend
```typescript
import {ConfigLoader} from 'typeconfig/src/ConfigLoader';

let Config = {
  Private: {
    something: 5,
    PORT: 1234
  },
  Public: {
    a: 6
  }
};

ConfigLoader.loadBackendConfig(Config, // Config object to load the data to
  path.join(__dirname, './../../../config.json'), // configuration file path
  [{key: 'Private-PORT', alias: 'PORT'}]); // environmental variable mapping to config variable
```

### frontend

```typescript
import {WebConfigLoader} from 'typeconfig/src/WebConfigLoader';

let Config = {
  Public: {
    a: 6
  }
};

if (typeof ServerInject !== 'undefined' && typeof ServerInject.ConfigInject !== 'undefined') {
  WebConfigLoader.loadFrontendConfig(Config.Public, ServerInject.ConfigInject);
}
```

### config changing
  * updating config file (if not exist, it will be created)
  * setting environmental variable
  * Command line arguments
    *  `node index.js --Private-something=3 --Public-a=10`


# Recommended Usage
See `example/legacy` folder.

The architecture helps separating public and private configuration. Private config will be only available at server side, while Public config at front and backend side too.
The up-to-date public config is sent to the frontend with ejs template.

# Development

```shell
npm ci
npm run lint
npm test              # builds the sources and specs to CommonJS and to ES modules and runs both
npm run test:ts       # runs the .ts specs directly with ts-node (no build), e.g. npx mocha test/Loader.spec.ts
npm run test:package  # builds dist/ and checks the package: exports map, browser bundle, typings
```
