import * as ProgressBar from '../progress.mjs';
import { DateTime } from '../../vendor/luxon.mjs';
import * as Forecast from '../forecast/forecast.mjs';
import { AVAILABLE_NORMALS, getLineType, colorByLegend } from '../config.mjs';

// normal high/low temperatures for the WFO
const get = async (wfo) => {
	// cancel previous request if present
	get?.cancel?.();

	// prepare the body of the request
	const requestParams = {
		elems: [{
			name: 'maxt', interval: 'dly', duration: 'dly', normal: '91', prec: 0,
		}, {
			name: 'mint', interval: 'dly', duration: 'dly', normal: '91', prec: 0,
		}],
		sid: wfo,
		sDate: DateTime.now().minus({ days: 10 }).toISODate(),
		eDate: DateTime.now().plus({ days: 10 }).toISODate(),
	};
	const requestBody = new URLSearchParams();
	requestBody.append('output', 'json');
	requestBody.append('params', JSON.stringify(requestParams));

	try {
		const response = await fetch('https://data.rcc-acis.org/StnData', {
			headers: {
				accept: 'application/json',
			},
			body: requestBody,
			method: 'POST',
		});
		const data = await response.json();
		const formattedData = formatData(data.data);
		Forecast.formatNormalTemperatures(formattedData);
		ProgressBar.set('Normal temperatures received');
	} catch (e) {
		ProgressBar.message('Get normal temperatures failed', true);
	}
};

const formatData = (data) => {
	const dataset = Object.entries(AVAILABLE_NORMALS).map(([, config], idx) => ({
		data: makeTrend(data, idx),
		label: config.displayName,
		yaxis: config.yAxis,
		lines: getLineType(config.lineType, config.displayName),
		color: colorByLegend(config.displayName, false),
		points: { show: false },
		isNorm: true,
		scale: config.scale,
		lineType: config.lineType,
	}));
	return dataset;
};

const makeTrend = (data, selection) => data.map(([date, highString, lowString]) => {
	// turn date into timestamp, shifted +12h for high temperature
	const timestamp = Date.parse(date) + (selection === 0 ? 12 * 60 * 60 * 1000 : 0);
	const value = parseInt(selection === 0 ? highString : lowString, 10);
	return [timestamp, value];
});

export default get;

export {
	get,
};
