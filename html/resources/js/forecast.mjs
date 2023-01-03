import * as ProgressBar from './progress.mjs';
import { DateTime } from '../vendor/luxon.min.mjs';
import { forEachElem, convertTimestamp } from './utils.mjs';
import { getOptions, saveOptions } from './options.mjs';
import * as Menu from './menu.mjs';
import * as Table from './table.mjs';
import * as Tooltip from './tooltip.mjs';
import DataForecast, { OLD_FORECAST_LIMIT } from './forecast/forecast.mjs';
import DataObs from './forecast/observations.mjs';
import { getSavedLocation } from './placemanager.mjs';
import plotForecast from './forecast/plot.mjs';
import { SCALES, AXIS_LIMITS } from './config.mjs';
import ScaledNumber from '../vendor/scalednumber.mjs';

const metaData = {			// metadata
	minTimestamp: null,
	maxTimestamp: null,
	oldestData: null,
	lastUpdate: null,
	forecastTimestamp: null,
};
let plot = null; // the plot object once loaded
let obsTimeoutHandle = null;

// init
document.addEventListener('DOMContentLoaded', () => init());

const init = () => {
	// get timezone for conversion
	convertTimestamp.timeZoneOffset = (new Date()).getTimezoneOffset() * 60000; // time zone offset in milliseconds

	// catch window resize and update plot
	window.addEventListener('resize', windowResize);
	// and call it now to do the initial resize
	windowResize(false);

	Menu.registerClickHandler('menu-table', toggleTable);
	Menu.registerClickHandler('menu-units', toggleUnits);
};

// format data, private
// formats the data into proper pairs and timestamps
const formatData = (fcst, allObs, reset) => {
	// recalculate time zone if provided
	const { timeZone } = getSavedLocation();
	if (timeZone) {
		const placeTime = (DateTime.now().setZone(timeZone).startOf('day'));
		const userTime = (DateTime.now().startOf('day'));
		convertTimestamp.timeZoneOffset = (new Date()).getTimezoneOffset() * 60000 - (userTime - placeTime); // time zone offset in milliseconds
	}

	// if reset is provided clear out stored observation data
	if (reset) {
		if (plot) {
			plot.shutdown();
			plot = null;
		}
		clearTimeout(obsTimeoutHandle);
		obsTimeoutHandle = null;
		formatData.obs = undefined;
		Tooltip.generateTextForecastData();
	}

	// forecast data provided
	if (fcst !== false) {
		// log the time of the forecast
		metaData.lastUpdate = (new Date()).getTime();
		metaData.forecastTimestamp = fcst.properties.updateTime;

		// prepare and plot the data
		const dataset = DataForecast(fcst, metaData, getOptions());
		plotData(dataset);

		saveOptions('visible', readVisibility());

		// save text forecast data
		Tooltip.generateTextForecastData(fcst?.properties?.weather?.values);

		// clear the observation timeout handle
		clearTimeout(obsTimeoutHandle);

		// test for previously stored observations and plot it
		if (formatData.obs) formatData(false, formatData.obs);
		formatData.fcst = fcst;
	} // forecast data provided

	// format the observation data
	if (allObs !== false) {
		// store data
		const obs = allObs.data;
		formatData.obs = allObs;

		// intentional 2 second delay to allow forecast to load first
		// this creates a much nicer loading fade in
		if (!plot && !obsTimeoutHandle) {
			obsTimeoutHandle = setTimeout(() => formatData(fcst, allObs, reset), 2000);
			return;
		}
		// update progress bar
		ProgressBar.set('Observations received');

		// set observation station
		document.querySelector('#menu-footer-site').innerHTML = allObs.station;
		// see if forecast has been plotted by testing for presence of plot
		if (!plot) {
			const emptyMetaData = {
				minTimestamp: DateTime.now().startOf('day'),
				maxTimestamp: DateTime.now().plus({ days: 7 }).endOf('day'),
			};
			plot = plotForecast([], emptyMetaData, plotLimits(), inchAxes);
			chartVisibility(true);
			// indicate still loading
			document.getElementById('date').classList.add('loading');
		}
		if (obs?.features?.length > 0) {
			const dataset = DataObs(obs, metaData, getOptions());
			// update if temperature is available
			updateCurrentTemperature(dataset);
			// add the data to the plot
			const currentDataset = plot.getData();
			currentDataset.push(...dataset);
			// update minimums for scrolling
			// get plot limits
			const { endOfLast, oldestData } = plotLimits();
			plot.getOptions().xaxis.zoomRange = [11 * 60 * 60 * 1000, endOfLast - oldestData]; // 12 hours - range of data
			plot.getOptions().xaxis.panRange = [oldestData, endOfLast];
			plot.getAxes().xaxis.options.zoomRange = [11 * 60 * 60 * 1000, endOfLast - oldestData];
			plot.getAxes().xaxis.options.panRange = [oldestData, endOfLast];

			// redraw the plot
			plot.setData(currentDataset);
			plot.setupGrid(true);
			plot.draw();

			// store text descriptions
			Tooltip.generateTextForecastData(allObs.data.features, true);
		} // obs != 0 (no data provided)
	} // observation data provided
};

// calculate plotting limits
const plotLimits = () => {
	// if no metadata exists plot 7 days each way
	if (!metaData.minTimestamp || !metaData.maxTimestamp || !metaData.oldestData) {
		return {
			beginningOfFirst: convertTimestamp(DateTime.now().startOf('day')),
			endOfLast: convertTimestamp(DateTime.now().plus({ days: 7 }).endOf('day')),
			oldestData: convertTimestamp(DateTime.now().plus({ days: -7 }).startOf('day')),
		};
	}
	// calculate beginning of first day and end of last day to snap display to full days
	return {
		beginningOfFirst: convertTimestamp(metaData.minTimestamp.startOf('day')),
		endOfLast: convertTimestamp(metaData.maxTimestamp.endOf('day')),
		oldestData: convertTimestamp(metaData.oldestData.startOf('day')),
	};
};

// plot data, public
const plotData = (dataset) => {
	// get plot limits

	plot = plotForecast(dataset, metaData, plotLimits(), inchAxes); // plot function

	// show the chart
	chartVisibility(true);
};

// window resize, private
const windowResize = () => {
	// if the plot is drawn, redraw it
	if (plot === null) return;
	plot.resize();
	plot.setupGrid();
	plot.draw();
};

// get info, public
// returns select info about the plot
const getInfo = (type) => {
	// can't get anything if the plot isn't drawn
	if (plot === null) return null;
	switch (type) {
	// all available data
	case 'xMin':
		return plot.getAxes().xaxis.datamin;
	case 'xMax':
		return plot.getAxes().xaxis.datamax;

		// visible data
	case 'xMinVisible':
		return plot.getAxes().xaxis.min;
	case 'xMaxVisible':
		return plot.getAxes().xaxis.max;

		// oldest data
	case 'oldestData':
		return metaData.oldestData;
	case 'forecastTimestamp':
		return metaData.forecastTimestamp;
	case 'lastUpdate':
		return metaData.lastUpdate;

		// x axis limits
	case 'xLimits':
		return {
			min: plot.getAxes().xaxis.min,
			max: plot.getAxes().xaxis.max,
		};

	default:
		return plot[type];
	}
};

// generate table, private
const toggleTable = () => {
	// see if the chart is on the page
	if (window.getComputedStyle(document.querySelector('#chart-container')).opacity < 1) {
		Table.toggleTable(false);
	} else {
		// calculate and show the table
		Table.showTable(plot.getData());
		document.querySelector('#tooltip').classList.remove('show');
		Tooltip.hideTextForecast();
	}
};

// chart visibility, public
// show or hide the chart, with immediate option
const chartVisibility = (show) => {
	if (show) {
		document.getElementById('chart-container').classList.add('show');
		document.querySelector('.chart-area-button-container').classList.add('show');
		document.getElementById('loading').classList.remove('show');
	} else {
		document.getElementById('chart-container').classList.remove('show');
		document.querySelector('.chart-area-button-container').classList.remove('show');
		document.getElementById('loading').classList.add('show');
		forEachElem('#loading .centering>div', (elem) => elem.classList.remove('error'));
	}
};

// read the visibility of each series and return an object for use with saving options
const readVisibility = () => {
	const dataset = plot.getData();
	const result = {};
	dataset.forEach((series) => {
		// look for new objects
		if (!result?.[series.label]) {
			result[series.label] = series.lines.show;
		}
	});
	return result;
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

// set the units
// 0 = metric (provided nws values)
// 1 = US
const setUnits = (newUnit) => {
	// determine if unit changed
	const oldUnit = getOptions().units;
	if (newUnit === oldUnit) return;
	// store the new unit
	saveOptions('units', newUnit);
	// loop through the existing data
	const newData = plot.getData().map((series) => {
		// set the units
		series.scale.setUnit(newUnit);
		// loop through the data and convert
		series.data.forEach((point) => {
			point[1] = series.scale.set(point[1], oldUnit).valueOf();
		});
		return series;
	});

	// axis 3 and 4 need new scaling values
	const axes = plot.getAxes();
	const newAxes = inchAxes(newUnit);

	axes.y3axis.options.min = newAxes.y3.min;
	axes.y3axis.options.max = newAxes.y3.max;
	axes.y4axis.options.min = newAxes.y4.min;
	axes.y4axis.options.max = newAxes.y4.max;

	// update the current temperature
	updateCurrentTemperature(newData);

	// redraw the graph
	plot.setData(newData);
	plot.setupGrid(true);
	plot.draw();
};

const toggleUnits = () => {
	// get current units
	const { units } = getOptions();
	if (units === 0) {
		// in metric, switch to us
		setUnits(1);
	} else {
		// in US, switch to metric
		setUnits(0);
	}
	// get the text forecast (it switches units internally)
	Menu.unitsChanged();
};

const updateCurrentTemperature = (dataset) => {
	const temperatureData = dataset.find((d) => d.label === 'Temperature' && d.isObs);
	if (temperatureData) {
		const latestTemperature = temperatureData.data?.at?.(-1)?.[1];
		const { scale } = temperatureData;
		if (latestTemperature) {
			document.getElementById('current-temperature').innerHTML = latestTemperature.toFixed(scale.currentPrecision) + scale.currentUnitName;
		}
	}
};

export {
	getInfo,
	formatData,
	chartVisibility,
	setUnits,
	readVisibility,
	OLD_FORECAST_LIMIT,
};
