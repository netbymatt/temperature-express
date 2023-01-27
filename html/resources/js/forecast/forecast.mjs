import { DateTime } from '../../vendor/luxon.mjs';
import {
	AVAILABLE_TRENDS, getLineType, colorByLegend,
} from '../config.mjs';
import { getDuration, convertTimestamp } from '../utils.mjs';

const OLD_FORECAST_LIMIT = 10_800_000;

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

	// special filtering for rain/snow/ice
	// quantitativePrecipitation means any kind of precipitation
	// if snow or ice are also present for the same timespan, null
	// the quantitativePrecipitation value so only one shows (or two if ice and snow are present)
	const iceData = dataset.find((d) => d.label === 'Ice')?.data;
	const snowData = dataset.find((d) => d.label === 'Snow')?.data;
	const rainDataIndex = dataset.findIndex((d) => d.label === 'Rain');

	if (rainDataIndex) {
		// get the rain data
		const rainData = dataset[rainDataIndex].data;

		// scan for matching snow/ice timestamps with val ~== null and replace the rain data with null if present
		const newRainData = rainData.map(([timestamp, value]) => {
			if (iceData?.find(([ts, val]) => (ts === timestamp && val))) {
				return [timestamp, null];
			}

			if (snowData?.find(([ts, val]) => (ts === timestamp && val))) {
				return [timestamp, null];
			}
			return [timestamp, value];
		});

		// overwrite current rain data
		dataset[rainDataIndex].data = zeroAdjacentNulls(newRainData);
	}

	return dataset;
};

// format forecast as a set of series data arrays
const makeForecastTrend = (series, config, windDirections = []) => {
	const startOfHour = DateTime.utc().startOf('hour').toMillis();
	const dataWithNulls = series.flatMap((item) => {
		const duration = getDuration(item.validTime);

		// loop through duration at one hour intervals
		const eachHour = [];

		// calculate the value to add
		const value = config.valueFunction
			? [config.valueFunction(+config.scale.set(item.value, 0))]
			: [+config.scale.set(item.value, 0)];

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
			duration.startTime += 3_600_000;
		} while (duration.startTime < duration.endTime);
		return eachHour;
	});

	// some data requires extra processing
	if (!config.valueFunction) return dataWithNulls;

	return zeroAdjacentNulls(dataWithNulls);
};

// scan forwards and backwards through the array and replace a null that is adjacent
// modify data in place
const zeroAdjacentNulls = (data) => {
	const newData = [];
	const lastIndex = data.length - 1;
	for (let i = 0; i <= lastIndex; i += 1) {
		// copy only if not already touched
		if (!newData[i]) newData[i] = [data[i][0], data[i][1]];

		// forwards
		const next = data?.[i + 1]?.[1];
		if (data[i][1] === null && next !== null && next !== undefined) newData[i][1] = 0;

		// backwards
		const prev = data?.[lastIndex - i - 1]?.[1];
		if (data[lastIndex - i][1] === null && prev !== null && prev !== undefined) newData[lastIndex - i] = [data[lastIndex - i][0], 0];
	}
	return newData;
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
	// remove the loading indicator
	dateSpan.parentNode.classList.remove('loading');

	// if older than 3 hours alert user
	if (Date.now() - updateTime > OLD_FORECAST_LIMIT) {
		dateSpan.parentNode.classList.add('old');
	} else {
		dateSpan.parentNode.classList.remove('old');
	}
};

export default prepForecastData;
export { OLD_FORECAST_LIMIT };
