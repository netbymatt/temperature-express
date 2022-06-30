module.exports = {
	root: true,
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		// node: true,
		jquery: true,
	},
	extends: 'airbnb-base',
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2021,
	},
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
	},
};
