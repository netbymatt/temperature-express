import { DateTime } from '../../vendor/luxon.mjs';
import {
	AVAILABLE_OBS, getLineType, colorByLegend, getPointType,
} from '../config.mjs';
import { convertTimestamp } from '../utils.mjs';

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
	// loop through all timestamps
	const pairs = obs.features.map((item) => {
		// grab the feature
		const { timestamp } = item.properties;
		let observedValue = 0;
		let windDirection;
		/* eslint-disable unicorn/consistent-destructuring */
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
			observedValue = item.properties[name].value;
		}
		/* eslint-enable unicorn/consistent-destructuring */

		// do not pass along null values for cloud layers (this would extend the last known value)
		if (!observedValue && name !== 'cloudLayers') return null;

		// default pair
		const pair = [
			convertTimestamp(Date.parse(timestamp)),
			config.scale.set(observedValue, 0).valueOf(), // data, set as base units and returned in selected units
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

export default prepObsData;
