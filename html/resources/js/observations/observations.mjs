import { DateTime } from '../../vendor/luxon.mjs';
import {
	AVAILABLE_OBS, getLineType, colorByLegend, getPointType,
} from '../config.mjs';
import * as ProgressBar from '../progress.mjs';
import { fetchWithRetry, apiUrl, convertTimestamp } from '../utils.mjs';
import { getOptions, saveOptions } from '../options.mjs';
import * as Menu from '../menu.mjs';
import * as Forecast from '../forecast/forecast.mjs';
import { getPlace } from '../location.mjs';

const ALLOWED_NULLS = ['windSpeed', 'apparentTemperature', 'dewpoint', 'temperature'];

document.addEventListener('DOMContentLoaded', () => {
	Menu.registerClickHandler('menu-high-frequency', toggleButton);
	// set the initial state of the menu button
	updateMenuButton();
});

// prepare the observation data
const prepObsData = (obs, metaData, options) => {
	// update oldest data
	const minTimestamp = obs.features.reduce((prev, cur) => {
		const curDate = new Date(cur.properties.timestamp);
		if (curDate < prev) return curDate;
		return prev;
	}, new Date());
	// const minTimestamp = Date.parse(obs.features[obs.features.length - 1].properties.timestamp);
	metaData.oldestData = DateTime.fromJSDate(minTimestamp);

	// loop through available observations
	return Object.entries(AVAILABLE_OBS).map(([name, config]) => {
		// set the units
		config.scale.setUnit(options.units);
		// test for available feature
		if (obs.features[0].properties?.[name] || name === 'apparentTemperature') {
			return {
				data: makeObsTrend(obs, config, name),
				label: config.displayName,
				yaxis: config.yAxis,
				lines: getLineType(config.lineType, config.displayName),
				color: colorByLegend(config.displayName, true),
				points: getPointType(config.lineType, config.displayName),
				isObs: true,
				scale: config.scale,
				lineType: config.lineType,
			};
		}
		return false;
	}).filter((d) => d);
};

// format observation as a set of series data arrays
const makeObsTrend = (obs, config, name) => {
	const { highFrequency } = getOptions();
	// loop through all timestamps
	const pairs = obs.features.map((item) => {
		// check for "high-frequency update" as missing raw message
		if (item.properties.rawMessage === '' && !highFrequency) return null;
		// grab the feature
		const { timestamp } = item.properties;
		let observedValue = 0;
		let windDirection;
		switch (name) {
			case 'apparentTemperature':
				observedValue = item.properties.windChill.value
					?? item.properties.heatIndex.value
					?? item.properties.temperature.value;
				break;
			case 'windSpeed':
				observedValue = item.properties.windSpeed.value;
				windDirection = (item.properties.windDirection.value + 180) % 360;
				break;
			case 'cloudLayers':
				// return null to gap-fill when there are no cloud reports
				if (item.properties.cloudLayers.length === 0) return null;
				observedValue = decodeClouds(item.properties.cloudLayers);
				break;
			default:
				observedValue = config.valueFunction
					? config.valueFunction(item.properties[name].value)
					: +item.properties[name].value;
		}

		if (ALLOWED_NULLS.includes(name) && !observedValue) return null;

		// default pair
		const pair = [
			convertTimestamp(Date.parse(timestamp)),
			observedValue === null ? null : config.scale.set(observedValue, 0).valueOf(), // data, set as base units and returned in selected units
		];

		// add wind direction if provided
		if (windDirection) pair.push(windDirection);
		return pair;
	}).filter((d) => d !== null); // timestamp loop
	// sort the pairs
	const sorted = pairs.sort((a, b) => a[0] - b[0]);

	// make sure wind directions are only shown every hour
	if (name === 'windSpeed') {
		let lastWindTimestamp = 0;

		sorted.forEach((pair) => {
			if (pair.length < 3) return;
			const timeStampMs = (new Date(pair[0])).getTime();
			if (timeStampMs - lastWindTimestamp < 3_600_000) {
				// remove too frequent wind direction
				pair.pop();
			} else {
				// leave the wind direction but update the last timestamp
				lastWindTimestamp = timeStampMs;
			}
		});
	}

	return sorted;
};

const cloudValues = {
	SKC: 0,
	NCD: 0,
	CLR: 0,
	NSC: 0,
	FEW: 18,	// 1-2 oktas
	SCT: 43,	// 3-4 oktas
	BKN: 75,	// 5-7 oktas
	OVC: 100,
	VV: 100,
};

const decodeClouds = (data) => data.reduce((sum, cur) => {
	const amount = cloudValues[cur.amount] ?? 0;
	return sum + amount;
}, 0) / data.length;

const get = async (place) => {
	// cancel previous request if present
	get?.cancel?.();
	// calculate 7 days of observations
	const startDate = DateTime.local().minus({ days: 7 }).startOf('day').toISO({ suppressMilliseconds: true });
	// get the observation history for the station
	const url = `${apiUrl}stations/${place.station}/observations?start=${startDate}`;
	try {
		const fetchHandler = fetchWithRetry(url, 3);
		get.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		Forecast.formatData(false, { data, station: place.station });
	} catch (error) {
		// see if the other data arrived
		ProgressBar.set('Get observations failed!', true);
		Forecast.formatData(false, 0);	// special "no data present case"
	}
};

const toggleButton = () => {
	// get the current state
	const { highFrequency } = getOptions();

	// toggle and save the state
	saveOptions('highFrequency', !highFrequency);

	// update the menu button
	updateMenuButton();

	// redraw the plot
	getPlace();
};

const updateMenuButton = () => {
	// get the state
	const { highFrequency } = getOptions();

	// get interesting elements
	const elemHigh = document.querySelector('.side-menu .update-high');
	const elemStandard = document.querySelector('.side-menu .update-standard');

	if (highFrequency) {
		// show the high frequency div
		elemStandard.style.display = 'none';
		elemHigh.style.display = 'block';
	} else {
		// show the standard div
		elemStandard.style.display = 'block';
		elemHigh.style.display = 'none';
	}
};

export default prepObsData;
export {
	get,
};
