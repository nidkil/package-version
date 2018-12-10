module.exports = {
  root: true,
  extends: ['prettier', 'prettier/standard'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2017
  },
  env: {
    es6: true
  },
  overrides: [
    {
      files: ['bin/*.js', 'src/*.js', 'test/*.js'],
      excludedFiles: 'dist/*.js',
      rules: {
        quotes: [2, 'single'],
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'prettier/prettier': 'error'
      }
    }
  ]
}
