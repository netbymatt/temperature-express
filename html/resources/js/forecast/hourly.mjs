import * as ProgressBar from '../progress.mjs';
import { DateTime } from '../../vendor/luxon.mjs';
import * as Forecast from '../forecast.mjs';
import { fetchWithRetry, backoff, forEachElem } from '../utils.mjs';

// get an hourly forecast for a specified url
const get = async (baseUrl) => {
	// cancel previous request if present
	get?.cancel?.();
	getHourlyForecastRetry?.cancel?.();
	try {
		const fetchHandler = fetchWithRetry(baseUrl, 0, stillRetrying);
		get.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Hourly forecast received');
		// test for old data
		if (!forecastIsFresh(data)) {
			getHourlyForecastRetry(baseUrl);
		}
		// store the data
		Forecast.formatData(data, false);
	} catch (error) {
		ProgressBar.message('Get hourly forecast failed', true);
		stillRetrying(0, 2);
	}
};

// sometimes an out of date forecast is received, retry in the background
const getHourlyForecastRetry = async (url, count = 0) => {
	// clear cancel handle
	getHourlyForecastRetry.cancel = null;

	// message
	ProgressBar.message('Auto retrying for newer forecast');

	if (count > 0) {
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error('Unable to get fresher forecast');
			const data = await response.json();
			// if fresh update the chart
			if (forecastIsFresh(data)) {
				Forecast.formatData(data, false);
				return;
			}
		} catch (error) {
			ProgressBar.message(error.message, true);
		}
	}
	// call again
	const timeoutHandle = setTimeout(() => getHourlyForecastRetry(url, count + 1), backoff(count) * 1000);
	getHourlyForecastRetry.cancel = () => clearTimeout(timeoutHandle);
};

const forecastIsFresh = (data) => {
	const updateTime = DateTime.fromISO(data.properties.updateTime);
	return Date.now() - updateTime <= Forecast.OLD_FORECAST_LIMIT;
};

const stillRetrying = (e, iteration) => {
	if (iteration === 2) {
		ProgressBar.set('Get forecast failed', true);
		forEachElem('#loading .centering>div', (elem) => elem.classList.add('error'));
	}
};

export {
	get,
};
