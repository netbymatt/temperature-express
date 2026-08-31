import { CHART_CONTAINER_SELECTOR, SCALES, AXIS_LIMITS } from './config.mjs';
import { Duration } from '../vendor/auto/luxon.mjs';
import * as ProgressBar from './progress.mjs';
import ScaledNumber from '../vendor/scalednumber.mjs';

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

let isDark;
const readDarkMode = () => {
	isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
};
readDarkMode();

// watch for dark mode change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
	readDarkMode();
});

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
	} catch (error) {
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

// show error function
const showError = (title, heading, text) => {
	// fill values
	document.querySelector('#dialog-failed-heading').innerHTML = heading;
	document.querySelector('#dialog-failed-text').innerHTML = text;
	document.querySelector('#dialog-failed .dialog .title div').innerHTML = title;

	// show the dialog
	document.querySelector('#dialog-failed').classList.remove('initial-hide');
	setTimeout(() => document.querySelector('#dialog-failed').classList.add('show'), 1);
};

// chart visibility, public
// show or hide the chart, with immediate option
const chartVisibility = (show) => {
	if (show) {
		document.querySelector(CHART_CONTAINER_SELECTOR).classList.add('show');
		document.querySelector('.chart-area-button-container').classList.add('show');
		document.querySelector('#loading').classList.remove('show');
	} else {
		document.querySelector(CHART_CONTAINER_SELECTOR).classList.remove('show');
		document.querySelector('.chart-area-button-container').classList.remove('show');
		document.querySelector('#loading').classList.add('show');
		forEachElem('#loading .centering>div', (elem) => elem.classList.remove('error'));
	}
};

// get values for the y3 and y4 axes
const inchAxes = (units) => {
	const y3 = new ScaledNumber(0, 0, 1000, SCALES.INCHES);
	const y4 = new ScaledNumber(0, 0, 1000, SCALES.INCHES_ICE);
	const y5 = new ScaledNumber(0, 0, 1e7, SCALES.BAROMETER);
	const y7 = new ScaledNumber(0, 0, 1000, SCALES.INCHES_ICE);

	return {
		y3: {
			min: +y3.set(AXIS_LIMITS.y3.min, 1).setUnit(units),
			max: +y3.set(AXIS_LIMITS.y3.max, 1).setUnit(units),
		},
		y4: {
			min: +y4.set(AXIS_LIMITS.y4.min, 1).setUnit(units),
			max: +y4.set(AXIS_LIMITS.y4.max, 1).setUnit(units),
		},
		y5: {
			min: +y5.set(AXIS_LIMITS.y5.min, 1).setUnit(units),
			max: +y5.set(AXIS_LIMITS.y5.max, 1).setUnit(units),
		},
		y7: {
			min: +y7.set(AXIS_LIMITS.y7.min, 1).setUnit(units),
			max: +y7.set(AXIS_LIMITS.y7.max, 1).setUnit(units),
		},
	};
};

const formatPlaceName = (address) => {
	// no address is provided if lat/lon are used for coordinates
	if (!address) return null;
	const city = address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.hamlet ?? address.county ?? '';
	const { state } = address;
	if (!state) return city;
	return `${city}, ${state}`;
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
	showError,
	chartVisibility,
	inchAxes,
	formatPlaceName,
};
