module.exports = {
  root: true,
  parser: 'babel-eslint',
  env: {
    browser: true,
    es2020: true,
    jest: true,
    node: true
  },
  globals: {
    __DEV__: 'readonly'
  },
  rules: {
    'no-dupe-keys': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error'
  }
}
