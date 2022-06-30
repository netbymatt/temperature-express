// pass api calls through to weather.gov

// https get
const https = require('https');

// set default https options
const options = {
	headers: {
		'User-Agent': 'Hourly forecast graph',
		Accept: 'application/json, text/javascript, */*; q=0.01',
	},
};

// url source mappings
const urlMapping = (originalUrl) => {
	if (originalUrl.match(/^\/products\/outlook/)) return `https://www.spc.noaa.gov${originalUrl}`;
	return `https://api.weather.gov${originalUrl}`;
};

module.exports = async (req, res) => {
	// build a complete url
	const url = urlMapping(req.originalUrl);
	https.get(url, options, (getResponse) => {
		getResponse.on('end', () => res.end());
		getResponse.pipe(res);
	}).on('error', (e) => {
		console.error(e);
		res.status(404);
	});
};
