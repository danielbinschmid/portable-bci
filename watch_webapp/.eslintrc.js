// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential', 
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    'indent': 'off',
    'quotes': 'off',
    'space-before-function-paren': 'off',
    'no-trailing-spaces': 'off',
    'no-unused-vars': 'off',
    'semi': 'off',
    'comma-dangle': 'off',
    'eol-last': 'off',
    'padded-blocks': 'off',
    'spaced-comment': 'off',
    'space-infix-ops': 'off',
    'key-spacing': 'off',
    'handle-callback-err': 'off',
    'eqeqeq': 'off',
    'no-multiple-empty-lines': 'off',
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
