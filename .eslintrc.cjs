module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    '@bengineer.dev/react'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "@typescript-eslint/explicit-function-return-type": "error",
    "object-curly-spacing": ["error", "always"],
    "no-unused-vars": "off",
    "padding-line-between-statements": "off"
  },
  overrides: [
    {
      files: ["vite.config.ts"],
      rules: {
        "import/no-nodejs-modules": "off"
      }
    },
    // TEST CONDITIONS - REMOVE FOR REAL PROJECTS
    {
      files: ['*'],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "react/prop-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "jsx-a11y/no-autofocus": "off",
        "prefer-arrow-callback": "off",
        "no-console": "warn"
      }
    }
    //\TEST CONDITIONS - REMOVE FOR REAL PROJECTS
  ]
}
