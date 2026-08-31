import { src, dest } from 'gulp';
import rename from 'gulp-rename';
import { Transform } from 'node:stream';

const vendorSources = [
	'node_modules/@kevinburke/flot/dist/*.mjs',
	'node_modules/luxon/build/es6/*.mjs',

];

const copySuncalc = () => src('node_modules/suncalc/suncalc.cjs', { base: 'node_modules/suncalc' })
	.pipe(
		new Transform({
			objectMode: true,
			transform(file, _enc, cb) {
				const wrapped = `${file.contents.toString()}\nexport default SunCalc;\n`;
				file.contents = Buffer.from(wrapped);
				cb(null, file);
			},
		}),
	)
	.pipe(rename({ extname: '.mjs' }))
	.pipe(dest('html/resources/vendor/auto'));

const updateVendor = async () => {
	await src(vendorSources, { encoding: false })
		.pipe(rename({ dirname: '' }))
		.pipe(dest('html/resources/vendor/auto/'));
	await copySuncalc();
};

export {
	// eslint-disable-next-line import-x/prefer-default-export
	updateVendor,
};
