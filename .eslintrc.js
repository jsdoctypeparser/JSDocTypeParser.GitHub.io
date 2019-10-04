module.exports = {
  "env": {
    "node": true,
    "browser": true,
    "es6": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "prefer-const": [2],
    "no-var": [2],
    "quotes": [2, "single", "avoid-escape"],
    "no-use-before-define": [2, "nofunc"],
    "space-infix-ops": [2, { "int32Hint": false }],
    "curly": [2, "multi-line"],
    "comma-dangle": [2, "always-multiline"],

    // For Closure Library style parameter namings such as opt_optionalParam, var_args.
    "camelcase": 0
  }
};
