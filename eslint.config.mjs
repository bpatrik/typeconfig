// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import chaiFriendly from 'eslint-plugin-chai-friendly';

export default tseslint.config(
  {
    ignores: ['dist/', 'build/', 'coverage/', 'node_modules/', 'example/', '**/*.js', '**/*.d.ts']
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
    ],
    rules: {
      // the decorator and mixin plumbing works with untyped objects
      '@typescript-eslint/no-explicit-any': 'off',
      // public API, changing it to Record<> or a type literal would be noise
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // the type annotations of the config properties are read through decorator metadata (design:type)
      '@typescript-eslint/no-inferrable-types': 'off',
      // <any>value casts are the convention in the decorator plumbing
      '@typescript-eslint/consistent-type-assertions': 'off',
      'no-empty': ['error', {allowEmptyCatch: true}],
      '@typescript-eslint/no-unused-vars': ['error', {
        // the destructured but unused fields are dropped on purpose (rest siblings)
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_'
      }],
      // from the former tslint.json
      'curly': 'error',
      'eqeqeq': ['error', 'smart'],
      'quotes': ['error', 'single', {avoidEscape: true}],
      'max-len': ['error', {code: 140, ignoreUrls: true}],
    }
  },
  {
    files: ['test/**/*.ts', 'test/**/*.mjs'],
    plugins: {
      'chai-friendly': chaiFriendly
    },
    rules: {
      // turn off the strict TS version
      '@typescript-eslint/no-unused-expressions': 'off',
      // and enable the chai-friendly version
      'chai-friendly/no-unused-expressions': 'error',
      // the specs use stub classes with empty methods
      '@typescript-eslint/no-empty-function': 'off'
    }
  },
);
