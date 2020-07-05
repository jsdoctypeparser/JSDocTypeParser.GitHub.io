'use strict';

module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    quotes: [2, 'single', 'avoid-escape'],
    curly: [2, 'multi-line'],
    'prefer-const': [2],
    'no-var': [2],
    'no-use-before-define': [2, 'nofunc'],
    'space-infix-ops': [2, { 'int32Hint': false }],
    'comma-dangle': [2, 'always-multiline'],

    // For Closure Library style parameter namings such as opt_optionalParam, var_args.
    camelcase: 0,
  },
};
