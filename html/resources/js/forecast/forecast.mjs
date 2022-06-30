import { DateTime } from '../../vendor/luxon.min.mjs';
import {
	AVAILABLE_TRENDS, getLineType, colorByLegend,
} from '../config.mjs';
import { getDuration, convertTimestamp } from '../utils.mjs';

// prepare the forecast data
const prepForecastData = (fcst, metaData, options) => {
	// populate initial min and max
	const { startTime, endTime } = getDuration(fcst.properties.validTimes);
	metaData.minTimestamp = DateTime.fromMillis(startTime);
	metaData.maxTimestamp = DateTime.fromMillis(endTime);

	// special array of wind directions
	const thisSeries = fcst.properties.windDirection.values; // grab the data
	const windDirections = thisSeries.map(({ validTime, value }) => [
		convertTimestamp(getDuration(validTime).startTime),
		(value + 180) % 360,
	]);

	// set the last updated date
	setLastUpdate(fcst);

	// loop through each legend
	const dataset = Object.entries(AVAILABLE_TRENDS).map(([key, config]) => {
		// set the units
		config.scale.setUnit(options.units);
		if (key in fcst.properties) {
			const series = fcst.properties[key].values; // grab the data

			return {
				data: makeForecastTrend(series, config, windDirections),
				label: config.displayName,
				yaxis: config.yAxis,
				lines: getLineType(config.lineType, config.displayName),
				color: colorByLegend(config.displayName, false),
				points: { show: false },
				isObs: false,
				scale: config.scale,
				lineType: config.lineType,
			};
		}
		return false;
		// filter for any missing data
	}).filter((d) => d);

	// store oldest data
	metaData.oldestData = metaData.minTimestamp;

	return dataset;
};

// format forecast as a set of series data arrays
const makeForecastTrend = (series, config, windDirections = []) => {
	const startOfHour = DateTime.utc().startOf('hour').toMillis();
	return series.map((item) => {
		const duration = getDuration(item.validTime);

		// loop through duration at one hour intervals
		const eachHour = [];

		// calculate the value to add
		let value;
		if (config.valueFunction) {
			// additional value function
			value = [
				config.valueFunction(+config.scale.set(item.value), 0),
			];
		} else {
			// direct value copy
			value = [
				+config.scale.set(item.value, 0),
			];
		}
		// add wind direction if necessary
		if (config.displayName === 'Wind Speed') {
			value.push(findWindDirection(duration.startTime, windDirections));
		}
		// add this value for each hour
		do {
			// test for timestamp greater than now
			if (duration.startTime >= startOfHour) {
				eachHour.push([convertTimestamp(duration.startTime), ...value]);
			}
			// increment start time by 1 hour
			duration.startTime += 3600000;
		} while (duration.startTime < duration.endTime);
		return eachHour;
	}).flat(1);
};

// find wind direction, private
// finds wind direction in array of timestamp/wind directions pairs
const findWindDirection = (timestamp, windDirections = []) => {
	let direction = 0; // default case
	for (let i = 0; i < windDirections.length; i += 1) {
		// exit loop if we've gone past the provided timestamp
		if (windDirections[i][0] > timestamp) break;
		[, direction] = windDirections[i];
	}
	return direction;
};

const setLastUpdate = (fcst) => {
	const dateSpan = document.querySelector('#date span');
	const updateTime = DateTime.fromISO(fcst.properties.updateTime);

	dateSpan.innerHTML = updateTime.toLocaleString({
		weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
	});
	// if older than 3 hours alert user
	if (Date.now() - updateTime > 10800000) {
		dateSpan.classList.add('old');
	} else {
		dateSpan.classList.remove('old');
	}
};

export default prepForecastData;
