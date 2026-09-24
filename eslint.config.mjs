import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

/** Limits mirror CONTRIBUTING.md so humans and tooling enforce the same standard. */
const QUALITY_LIMITS = {
  complexity: 8,
  maxFileLines: 250,
  maxFunctionLines: 40,
  maxParams: 3,
  maxDepth: 3,
};

export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'next-env.d.ts', '*.config.*', 'reports/**'],
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  sonarjs.configs.recommended,
  jsxA11y.flatConfigs.strict,
  {
    plugins: { '@next/next': nextPlugin, 'simple-import-sort': simpleImportSort },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      complexity: ['error', QUALITY_LIMITS.complexity],
      'max-lines': ['error', { max: QUALITY_LIMITS.maxFileLines, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: QUALITY_LIMITS.maxFunctionLines, skipBlankLines: true, skipComments: true },
      ],
      'max-params': ['error', QUALITY_LIMITS.maxParams],
      'max-depth': ['error', QUALITY_LIMITS.maxDepth],
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
      eqeqeq: 'error',
    },
  },
  {
    files: ['src/core/constants.ts'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
);
