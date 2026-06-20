/**
 * Nest dev watch — ignore heavy dirs outside backend src.
 * @param {import('webpack').Configuration} options
 */
module.exports = (options) => ({
  ...options,
  watchOptions: {
    ...options.watchOptions,
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/storage/**',
      '**/docs/**',
      '**/coverage/**',
      '**/prisma/**',
      '**/*.md',
    ],
  },
});
