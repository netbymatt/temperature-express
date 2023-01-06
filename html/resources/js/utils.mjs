import { Duration } from '../vendor/luxon.min.mjs';
import * as ProgressBar from './progress.mjs';

// turn an ISO date and duration into start, end and duration
const getDuration = (timeWithDuration) => {
	const [timestampString, durationString] = timeWithDuration.split('/');
	const startTime = Date.parse(timestampString);
	const duration = Duration.fromISO(durationString).as('milliseconds');
	const endTime = startTime + duration;
	return { startTime, duration, endTime };
};

// subtract timezone offset from timestamp since flot is always working in UTC
const convertTimestamp = (timestamp) => timestamp - convertTimestamp.timeZoneOffset;

const forEachElem = (selector, callback) => document.querySelectorAll(selector).forEach(callback);

// watch for dark mode change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
	readDarkMode();
});
let isDark;

const readDarkMode = () => {
	isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	// if (redraw) {
	// 	formatData(formatData.fcst ?? false, formatData.obs ?? false);
	// }
};
readDarkMode();

// set the apiUrl from either one provided on the web page or the default
// eslint-disable-next-line no-undef
const apiUrl = (typeof _apiUrl === 'string') ? _apiUrl : 'https://api.weather.gov/';

const dark = () => isDark;

const backoff = (iteration) => {
	switch (iteration) {
	case 0: return 2;
	case 1: return 2;
	case 2: return 4;
	case 3: return 8;
	case 4: return 16;
	case 5:
	default:
		return 32;
	}
};

// it's possible that the api returns 500 for several seconds after the first call
// retry once after the backoff time, then alert the user
// retries will continue in the background at an quasi-exponential backoff
const fetchWithRetry = (url, maxRetries, stillRetrying) => {
	let iteration = 0;
	let timeoutHandle = null;

	const fetchInternal = async (resolve, reject) => {
		timeoutHandle = null;
		try {
			const response = await fetch(url);
			if (response.status === 200) {
				const data = await response.json();
				if (data?.status !== undefined) throw new Error(`Internal error code from NWS: ${data.status}`);
				resolve(data);
			} else {
				throw new Error(response.status);
			}
		} catch (error) {
			iteration += 1;
			ProgressBar.message(`Retrying ${url} count: ${iteration}`);
			ProgressBar.message(error, true);
			if (typeof stillRetrying === 'function') stillRetrying(error, iteration);
			if (maxRetries <= 0 || maxRetries === undefined || iteration < maxRetries) {
				timeoutHandle = setTimeout(() => fetchInternal(resolve, reject), backoff(iteration) * 1000);
			} else {
				reject('Maximum retries reached');
			}
		}
	};

	const cancel = () => {
		if (timeoutHandle) clearTimeout(timeoutHandle);
	};

	const data = new Promise((resolve, reject) => {
		fetchInternal(resolve, reject);
	});

	return {
		cancel,
		data,
	};
};

// simple fetch wrapper that return null for errors per the data[] description above
const getFile = async (url, name) => {
	try {
		const response = await fetch(url);
		if (response.status !== 200) throw new Error(`Status code ${response.status}`);
		const fileData = await response.json();
		return fileData.features;
	} catch (error)	{
		ProgressBar.message(`Error getting ${name ?? ''} spc outlook: ${url}`, true);
		ProgressBar.message(error, true);
		return null;
	}
};

const formatDay = (index) => {
	switch (index) {
	case 0:
		return 'Today';
	case 1:
		return 'Tomorrow';
	default:
	}

	// calculate date
	const date = (new Date(Date.now() + 86_400 * 1000 * index));
	const formatter = new Intl.DateTimeFormat([], { weekday: 'short', month: 'short', day: 'numeric' }).format;
	return formatter(date);
};

export {
	getDuration,
	convertTimestamp,
	forEachElem,
	dark,
	apiUrl,
	backoff,
	fetchWithRetry,
	getFile,
	formatDay,
};
