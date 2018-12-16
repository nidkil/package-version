module.exports = {
  input: './src/use-pkg-version-cli.js',
  outDir: './dist',
  format: ['es', 'cjs'],
  name: 'use-pkg-version',
  filename: '[name][suffix].js',
  banner: true,
  target: 'node',
  alias: {
    '@': require('path').resolve(__dirname, 'src')
  }
}
