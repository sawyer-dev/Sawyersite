import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', '.astro/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.tsx'],
    // The jsx-a11y plugin itself is already registered by the Astro config above.
    rules: jsxA11y.flatConfigs.recommended.rules,
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs', '*.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['**/*.astro'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
