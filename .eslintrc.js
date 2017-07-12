module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'script',
  },
  extends: [
    'airbnb-base',
  ],
  env: {
    node: true,
  },
  rules: {
    // airbnb overrides
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      // dangling commas in functions are not part of the spec yet
      functions: 'ignore',
    }],
    'max-len': 'off',
    'no-underscore-dangle': 'off',
    // prevents step-down code style, so disable it for functions and classes
    'no-use-before-define': ['error', {
      functions: false,
      classes: false,
      variables: true,
    }],
    'object-curly-spacing': ['error', 'never'],
  },
};

