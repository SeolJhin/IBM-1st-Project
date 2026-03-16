module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'react/prop-types': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    'Skote_React_Laravel_v3.0.0/',
  ],
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', 'src/setupTests.js'],
      env: {
        jest: true,
      },
      globals: {
        vi: 'readonly',
        jest: 'readonly',
      },
    },
  ],
};
