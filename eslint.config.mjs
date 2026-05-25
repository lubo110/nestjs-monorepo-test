import eslintConfig from '@antfu/eslint-config'

export default eslintConfig({
  rules: {
    'n/prefer-global/process': 'off',
    '@typescript-eslint/no-import-type-side-effects': 'error',
    '@typescript-eslint/consistent-type-imports': 'off',
    'no-useless-catch': 'off',
    'no-console': 'off',
    'unicorn/throw-new-error': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'n/prefer-global/buffer': 'off',
    'new-cap': 'off',
  },
})
