# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

`typeconfig` is a small npm library (MIT, author Patrik J. Braun) for declaring typed application
configuration as TypeScript classes with decorators. A config class can be loaded from a JSON file,
CLI arguments and environment variables, validated against property types/constraints, and serialized
back to JSON (optionally with descriptions, defaults and state). It also has a browser-side variant
for sharing a "public" subset of the config with a frontend.

Only runtime dependency: `minimist`. If a `@ConfigProperty` has no explicit `type`, it is inferred via
`Reflect.getMetadata('design:type', ...)`, so consumers then need `emitDecoratorMetadata` and
`reflect-metadata` (`import 'reflect-metadata'` before any decorated class); without them the decorator
throws an error naming the class and property. Consumers also need `experimentalDecorators` and
`useDefineForClassFields: false`.

## Commands

```bash
npm ci                # install
npm run lint          # ESLint (eslint.config.mjs)
npm run typecheck     # tsc --noEmit over sources and specs
npm run build         # dist/cjs + dist/esm
npm test              # compiles sources+specs to build/test/cjs and build/test/esm, runs mocha on both (c8 coverage on cjs)
npm run test:package  # builds dist/, runs test/package/*.spec.mjs and attw (are-the-types-wrong)
npm run test:ts       # runs the .ts specs directly through ts-node (no build), also: npx mocha test/Loader.spec.ts
```

- `npm test` runs against **compiled JS**, twice: as CommonJS and as ES modules. Specs must work in both
  (no `__dirname`/`require`; use imports, `TestHelper` uses `os.tmpdir()`).
- `.mocharc.json` (ts-node) is for running the `.ts` specs directly, e.g. from WebStorm. It needs
  `"ts-node": {"experimentalResolver": true}` in `tsconfig.json` to map the `.js` imports to `.ts`.
  The compiled runs pass `--no-config` to skip it. tsx can't run the specs: esbuild emits no decorator metadata.
- Relative imports in `.ts` files must end in `.js` (needed by the ES module build).
- Re-exported types need `export type`, types used in decorated signatures need `import type`
  (`isolatedModules` is on, as it will be for the PiGallery2 frontend).
- `dist/`, `build/` and `coverage/` are git-ignored; never commit them.
- Never write a `node.js` (or `node.cmd`, `node.bat`, ...) into the repo root: cmd.exe, which runs the npm scripts on
  Windows, would start it instead of node.exe for every bare `node` call (tsc, mocha, rimraf), silently skipping them.
- CI: `.github/workflows/ci.yml` runs lint, `npm test` and `npm run test:package` on the Node LTS lines
  22/24/26 (22 is the minimum supported version, also in `engines`; the published code targets ES2022), then publishes new versions (see Gotchas).

## Packaging

- `tsconfig.json` is the base (editor, typecheck, ESLint; `module: Node20`). `tsconfig.cjs.json` builds
  `dist/cjs`, `tsconfig.esm.json` builds `dist/esm`; `test/tsconfig.{cjs,esm}.json` build the specs.
  `scripts/mark-module-type.mjs` writes the `{"type": ...}` package.json into each output folder.
- `package.json` `exports` map: `.`, `./common`, `./node`, `./web` with `import`/`require` conditions and
  per-format types, plus `./src/*` for the legacy deep imports (deprecated, kept for compatibility).
  `typesVersions` makes the same paths resolve for `moduleResolution: node` (node10), which PiGallery2's
  backend uses.
- The committed `common/`, `node/` and `web/` folders hold `index.js` + `index.d.ts` shims that re-export `dist/cjs`, for
  consumers importing by file path (PiGallery2's `ConfigDiagnostics.ts` imports
  `../../../../node_modules/typeconfig/node`).
- `"sideEffects": false`: the modules only declare classes/functions; keep it that way.
- `typeconfig/common` and `typeconfig/web` must not pull in Node built-ins or `minimist`;
  `test/package/package.spec.mjs` bundles them with esbuild for the browser to check it.

## Layout

Entry points (package root, compiled to `dist/{cjs,esm}`):
- `common.ts` — environment-agnostic exports (`ConfigProperty`, `SubConfigClass`, `ConfigDefaults`,
  `ConfigState`, `ConstraintError`, `GenericConfigType`, `ConfigMap`) and the public/private interfaces
  and option types (`IConfigClass(Private)`, `IWebConfigClass(Private)`, `ConfigClassOptions`, `ToJSONOptions`, ...).
- `node.ts` — Node-only: `ConfigClass`, `ConfigClassBuilder` (+ the node option types).
- `web.ts` — browser: `WebConfigClass`, `WebConfigClassBuilder` (+ the web option types).

`src/`:
- `decorators/class/base/ConfigClassBase.ts` — **the core** (~1000 lines). Mixin that wraps a user class
  and implements state tracking, validation (`__validate`, `__validateType`, `__validateConstrains`),
  JSON loading (`__loadJSONObject`, `__loadDefaultsJSONObject`, `__loadStateJSONObject`),
  `toJSON`, defaults/hard-defaults, dynamic properties, cloning and the `--help` man page printer.
- `decorators/class/base/AbstractRootConfigClass.ts` — root mixin: wires parent/root links, validates
  everything on construction (throws `ConstraintError`), propagates defaults.
- `decorators/class/ConfigClass.ts` — Node root decorator: `load`/`loadSync`, `save`/`saveSync`,
  CLI meta-switches (`--config-path`, `--config-attachState`, ...), `--help`, CLI/ENV default overrides.
- `decorators/class/WebConfigClass.ts` — browser root decorator: `load(json)` + optional URL query params.
- `decorators/class/SubConfigClass.ts` — nested config classes.
- `decorators/property/ConfigPropoerty.ts` (sic, misspelled filename — keep it) — property decorator;
  stores `IPropertyMetadata` in `__state` and replaces the property with a validating getter/setter.
- `decorators/property/IPropertyState.ts` — `PropertyOptions`, `IPropertyMetadata`, `propertyTypes`
  (`integer`, `float`, `ratio`, `unsignedInt`, `positiveFloat`, `boolean`, `string`, `password`,
  `date`, `array`, `object`, enums, config classes).
- `decorators/builders/*` — pure typing helpers that cast an instance to `IConfigClass & T`.
- `GenericConfigType.ts` / `ConfigMap.ts` — config objects whose properties are added at runtime.
- `ConfigLoader.ts`, `Loader.ts` — CLI/ENV parsing into nested objects (`a-b-c=1` → `{a:{b:{c:1}}}`);
  also the deprecated legacy `loadBackendConfig` API.
- `WebConfigLoader.ts` — legacy frontend loader + URL param parsing.

`test/` mirrors `src/` (mocha + chai, `*.spec.ts`); `TestHelper` manages a `test/tmp` folder for file
I/O tests. `example/` shows modern (`example/config`) and legacy usage and is excluded from the build.

## Key concepts and invariants

- **Load precedence** (`ConfigClass.load`): defaults from file `__defaults` and CLI/ENV `default-` prefix
  → config file values → CLI args → ENV vars. Values set from CLI/ENV become readonly unless
  `disableAutoReadonly`; `softReadonly` tracks readonly without enforcing it.
- The config file may be auto-created (`saveIfNotExist` defaults to `true`) and rewritten with CLI/ENV
  values (`rewriteCLIConfig` / `rewriteENVConfig`).
- Each property has `value`, `default` (overridable) and `hardDefault` (from the class definition).
- Internal members are prefixed with `__` and exposed via `IConfigClassPrivate*` interfaces; the public
  surface is `IConfigClass` / `IWebConfigClass` (`load`, `save`, `toJSON`, ...). Keep that split.
- `toJSON` options (`attachDescription`, `attachState`, `skipDefaultValues`, `enumsAsString`,
  `skipTags`/`keepTags`) shape the persisted / sent-to-frontend JSON; tags are used to filter what is public.
- Setting `NODE_ENV=debug` enables verbose `[Typeconfig]` logging in `ConfigClass.ts`.
- `fs`, `fsPromise` and `path` are injectable via options; use them (not the globals) inside
  `ConfigClass` so the browser build and tests stay mockable.

## Downstream consumers (treat as the compatibility contract)

The maintainer's own projects depend on this library; check them before changing behaviour or APIs.
Local checkouts live next to this repo (`../PiGallery2`, `../xlf-google-translate`).

**PiGallery2** (`typeconfig` 2.3.4) — the heavy user:
- Config is in `src/common/config/`: `PrivateConfigClass` (`@ConfigClass`, Node backend), `WebConfig`
  (`@WebConfigClass({softReadonly: true})` + `@ConfigState()`, admin settings UI) and public `ClientClass`
  (`@WebConfigClass`, loaded in the browser from server-injected JSON).
- Uses the full CLI setup (all `cli.enable` switches, `cli.defaults.enabled`), `saveIfNotExist`,
  `attachDescription`, `enumsAsString`, `softReadonly`, `crateConfigPathIfNotExists` (in tests), and an
  `onLoadedSync` hook that mutates and `saveSync()`s the config.
- Loads twice: `loadSync({preventSaving: true})` to bootstrap paths, then a full `load`/`loadSync`.
  It calls `load()` twice when the file does not exist yet as a workaround (its TODO: typeconfig
  "can properly load defaults in arrays") — a known weak spot.
- Rich custom `TAGS` type (`client`, `secret`, `priority`, `name`, `uiIcon`, `uiType`, functions like
  `relevant`/`uiDisabled`, ...). Public config is produced with
  `toJSON({attachVolatile: true, skipTags: {secret: true}, keepTags: {client: true}})`; the settings UI
  gets `attachState: true` JSON. Tag filtering, `attachVolatile` and state serialization must keep working,
  including tags whose values are functions.
- Settings save flow: assigns a plain JSON object to a sub-config property
  (`config[settingsPath] = json`), re-serializes with `toJSON`, assigns again, then `save()`.
- `GenericConfigType` and `ConfigMap` (with `IConfigMap`) back the extension configs, added at runtime.
- **Reads private internals:** `__state` (incl. `value`, `volatile`, `isConfigType`, `tags`), `__options`
  (`configPath`) and `__propPath`, mostly in the Angular settings UI.
- **Deep-imports compiled files:** `typeconfig/src/GenericConfigType`,
  `src/decorators/builders/{ConfigClassBuilder,WebConfigClassBuilder}`,
  `src/decorators/class/{IConfigClass,IWebConfigClass,SubConfigClass,WebConfigClass}`,
  `src/decorators/property/ConfigPropoerty` (served by the `./src/*` export), and one file path import
  (`../../../../node_modules/typeconfig/node`, served by the `node/` shim folder). Everything it deep-imports is
  also exported from the entry points, so it can move off the deep imports (task T2 of
  [PiGallery2 #1219](https://github.com/bpatrik/pigallery2/issues/1219)).
- Its backend compiles with `moduleResolution: node` (node10), the Angular frontend with `bundler`
  (and plans `isolatedModules` without `emitDecoratorMetadata`, task T3).
- Loading server and client config classes in one process trips a constraint: subclasses add their
  properties to the parent prototype's shared `__state` (ConfigPropoerty.ts uses `target.__state`
  inherited from the parent). Changing that is a behaviour change; verify against PiGallery2.

How to verify a change against PiGallery2: `npm pack`, move its `node_modules/typeconfig` aside, extract
the tarball there, then run its `npx tsc`, `TEST_MYSQL=false npx mocha test --exclude "test/cypress/**/*.js"
--exclude folder-reset.js` and `npx ng build --configuration=dev --watch=false --output-path=<tmp>`,
compare `__printMan()` and `JSON.stringify(config)` of `PrivateConfigClass`, then restore the folder.

**xlf-google-translate** (`typeconfig` 2.3.1) — the simple, typical case: one `@ConfigClass` with
`@SubConfigClass` children, the same CLI options block as PiGallery2,
`ConfigClassBuilder.attachInterface(new ConfigBuilder())` then `Config.loadSync()` at module load.
Imports only `typeconfig/node` and `typeconfig/common`.

Implications for changes here:
- Removing the `./src/*` export, the `typesVersions` or the `common|node|web/` shim folders is a **breaking change** (major version).
- Renaming/moving files under `src/` (including the misspelled `ConfigPropoerty.ts`) or the names of
  `__state`/`__options`/`__propPath` and `IPropertyMetadata` fields is a **breaking change**.
- Keep the shape of `toJSON` output (descriptions as `//[prop]`, `__state` with `attachState`), the
  file's optional hand-written `__defaults` block and the load precedence stable; both apps persist
  and re-read these files.

## Git workflow

- Work and commit on `master` by default; only use another branch if the maintainer asks for one.
- Never commit automatically. Leave changes uncommitted so the maintainer can review them in WebStorm,
  and commit only when explicitly asked.

## Keeping this file current

When the repo owner (Patrik J. Braun) tells you something new about the project, its conventions or
their preferences that a future agent would need, update this file accordingly (and leave the change
uncommitted for review like any other).

## Code style

- 2-space indent, single quotes, max line length 140, curly braces always, UTF-8, final newline
  (`.editorconfig`, `eslint.config.mjs`).
- Imports use `{Name}` without inner spaces; explicit `typeof x === 'undefined'` checks are the norm.
- `noImplicitAny` is on; `<any>` casts are common in decorator plumbing — follow the surrounding code.
- Tests: one `describe` per class, decorated classes declared inline inside each `it`, assertions via
  `chai.expect(...)`. Add a spec next to the matching area when changing behaviour.

## Gotchas

- Decorator order/metadata matters: `experimentalDecorators` and `useDefineForClassFields: false` are required
  (also in this repo's tsconfig: target ES2022 would default it to `true` and class fields would shadow the
  decorators' accessors); `emitDecoratorMetadata` is needed for inferred types. Arrays of enums/config classes
  need `arrayType` set explicitly (it can't be inferred).
- The explicit type annotations of config properties (`num: number = 5`) feed `design:type`, which is why
  ESLint's `no-inferrable-types` is off. Don't remove them.
- Decorators return mixin subclasses of the user class (deep prototype chain); `__getNewInstance`
  must be overridden in each root decorator so `clone()` builds the decorated type.
- `ConfigClass` reads `process.argv` (incl. `--help`, which calls `process.exit`) at decoration and
  construction time — tests that touch CLI handling must restore `process.argv` / `process.env`.
- Releasing = bumping `version` in `package.json` and pushing to master: the `publish` job in `.github/workflows/ci.yml`
  publishes it to npm (npm trusted publishing, no token) once the tests pass, and pushes a git tag with the plain version
  (e.g. `2.4.0`). Pre-release versions (`2.4.0-beta.1`) go to the `next` dist-tag. Never run `npm publish` from an agent.
