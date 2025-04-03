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
	],
	globals: {
		SunCalc: 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2024,
	},
	plugins: [
	],
	rules: {
		indent: [
			'error',
			'tab',
			{
				SwitchCase: 1,
			},
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
