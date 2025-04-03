import * as ProgressBar from '../progress.mjs';
import { DateTime } from '../../vendor/luxon.mjs';
import * as Forecast from '../forecast/forecast.mjs';

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
		ProgressBar.set('Normal temperatures received');
		Forecast.formatNormalTemperatures(data);
	} catch (e) {
		ProgressBar.message('Get normal temperatures failed', true);
	}
};

export {
	get,
};
