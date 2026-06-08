import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      // `process` is replaced by Vite at build time (e.g. process.env.NODE_ENV).
      globals: { ...globals.browser, process: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      // Purely cosmetic in JSX text; React renders these entities fine.
      'react/no-unescaped-entities': 'off',
      // Allow valid styled-jsx / SVG / shadcn (cmdk, toast) attributes while
      // still catching genuine typos.
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'jsx',
            'global',
            'clip-rule',
            'fill',
            'cmdk-input-wrapper',
            'toast-close',
          ],
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Build/config files run in Node, not the browser.
    files: ['**/*.config.{js,cjs,mjs}', 'tailwind.config.js', 'vite.config.js', 'postcss.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
