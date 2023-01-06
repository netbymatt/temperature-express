module.exports = {
	root: true,
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		// node: true,
		jquery: true,
	},
	extends: [
		'airbnb-base',
		'plugin:sonarjs/recommended',
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2021,
	},
	plugins: [
		'unicorn',
		'sonarjs',
	],
	rules: {
		indent: [
			'error',
			'tab',
		],
		'no-tabs': 0,
		'no-use-before-define': 0,
		'max-len': ['error', { code: 200 }],
		'import/no-extraneous-dependencies': 0,
		'no-param-reassign': ['error', { props: false }],
		'import/extensions': [
			'error',
			{
				mjs: 'always',
				json: 'always',
			},
		],
		// unicorn
		'unicorn/numeric-separators-style': 'error',
		'unicorn/prefer-query-selector': 'error',
		'unicorn/catch-error-name': 'error',
		'unicorn/no-negated-condition': 'error',
		'unicorn/better-regex': 'error',
		'unicorn/consistent-function-scoping': 'error',
		'unicorn/prefer-array-flat-map': 'error',
		'unicorn/prefer-array-find': 'error',
		'unicorn/prefer-regexp-test': 'error',
		'unicorn/consistent-destructuring': 'error',
		'unicorn/prefer-date-now': 'error',
		'unicorn/prefer-ternary': 'error',
		'unicorn/prefer-dom-node-append': 'error',
		'unicorn/explicit-length-check': 'error',
		'unicorn/prefer-at': 'error',
		'sonarjs/cognitive-complexity': 0,
	},
};
