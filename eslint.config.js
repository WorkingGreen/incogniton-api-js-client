export default {
  plugins: ['@typescript-eslint'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'], // Adjust this to match your project structure
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'import/no-unresolved': 'off', // Optionally disable unresolved import errors
    '@typescript-eslint/no-explicit-any': 'warn', // Allow 'any' but warn about its usage
    '@typescript-eslint/no-unsafe-assignment': 'off', // Disable unsafe assignment checks
    '@typescript-eslint/no-unsafe-member-access': 'off', // Disable unsafe member access checks
    '@typescript-eslint/no-unsafe-return': 'off', // Disable unsafe return checks
    '@typescript-eslint/no-unsafe-argument': 'off', // Disable unsafe argument checks
  },
};