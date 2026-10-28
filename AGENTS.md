# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

`typeconfig` is a small npm library (MIT, author Patrik J. Braun) for declaring typed application
configuration as TypeScript classes with decorators. A config class can be loaded from a JSON file,
CLI arguments and environment variables, validated against property types/constraints, and serialized
back to JSON (optionally with descriptions, defaults and state). It also has a browser-side variant
for sharing a "public" subset of the config with a frontend.

Only runtime dependency: `minimist`. Consumers must provide `reflect-metadata`
(`import 'reflect-metadata'` before any decorated class), because `@ConfigProperty` infers types via
`Reflect.getMetadata('design:type', ...)`.

## Commands

```bash
npm ci            # install
npm run build     # tsc — compiles .ts to .js/.d.ts next to the sources (no outDir)
npm test          # pretest runs tsc, then nyc mocha --recursive test (runs the compiled test/**/*.js)
```

- Tests run against **compiled JS**, so always build (or just run `npm test`) after editing.
- Compiled `*.js`, `*.js.map`, `*.d.ts` are git-ignored; never commit them.
- CI: `.github/workflows/build.yml` runs `npm ci && npm run build && npm test` on Node 18/20/21.
- Lint config is `tslint.json` (tslint is legacy but still the style reference); there is no lint script.

## Layout

Entry points (package root, `main` is `common.js`):
- `common.ts` — environment-agnostic exports (`ConfigProperty`, `SubConfigClass`, `ConfigDefaults`,
  `ConfigState`, `GenericConfigType`, `ConfigMap`, both builders and both root decorators, types).
- `node.ts` — Node-only: `ConfigClass`, `ConfigClassBuilder`.
- `web.ts` — browser: `WebConfigClass`, `WebConfigClassBuilder`.

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
  `src/decorators/property/ConfigPropoerty`.

**xlf-google-translate** (`typeconfig` 2.3.1) — the simple, typical case: one `@ConfigClass` with
`@SubConfigClass` children, the same CLI options block as PiGallery2,
`ConfigClassBuilder.attachInterface(new ConfigBuilder())` then `Config.loadSync()` at module load.
Imports only `typeconfig/node` and `typeconfig/common`.

Implications for changes here:
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
  (`.editorconfig`, `tslint.json`).
- Imports use `{Name}` without inner spaces; explicit `typeof x === 'undefined'` checks are the norm.
- `noImplicitAny` is on; `<any>` casts are common in decorator plumbing — follow the surrounding code.
- Tests: one `describe` per class, decorated classes declared inline inside each `it`, assertions via
  `chai.expect(...)`. Add a spec next to the matching area when changing behaviour.

## Gotchas

- Decorator order/metadata matters: `emitDecoratorMetadata` + `experimentalDecorators` are required, and
  arrays of enums/config classes need `arrayType` set explicitly (it can't be inferred).
- Decorators return mixin subclasses of the user class (deep prototype chain); `__getNewInstance`
  must be overridden in each root decorator so `clone()` builds the decorated type.
- `ConfigClass` reads `process.argv` (incl. `--help`, which calls `process.exit`) at decoration and
  construction time — tests that touch CLI handling must restore `process.argv` / `process.env`.
- Bump `version` in `package.json` for releases; don't publish from an agent.
