import * as ProgressBar from '../progress.mjs';
import { DateTime } from '../../vendor/luxon.mjs';
import { convertTimestamp, chartVisibility, inchAxes } from '../utils.mjs';
import { getOptions, saveOptions } from '../options.mjs';
import * as Menu from '../menu.mjs';
import * as Tooltip from '../tooltip.mjs';
import prepForecastData from './utils.mjs';
import prepObsData from '../observations/utils.mjs';
import { getSavedLocation } from '../placemanager.mjs';
import plotForecast from '../plot/plot.mjs';
import plotLimits from './plotLimits.mjs';

import readVisibility from './readVisibility.mjs';
import updateCurrentTemperature from './updateCurrentTemperature.mjs';

const metaData = { // metadata
	minTimestamp: null,
	maxTimestamp: null,
	oldestData: null,
	lastUpdate: null,
	forecastTimestamp: null,
};
let plot = null; // the plot object once loaded
let obsTimeoutHandle = null;

// plot data, public
const plotData = (dataset) => {
	// get plot limits

	plot = plotForecast(dataset, metaData, plotLimits(metaData), inchAxes); // plot function

	// show the chart
	chartVisibility(true);
};

// format data, private
// formats the data into proper pairs and timestamps
const formatData = (fcst, allObs, reset, normals) => {
	// recalculate time zone if provided
	const { timeZone } = getSavedLocation();
	if (timeZone) {
		const placeTime = (DateTime.now().setZone(timeZone).startOf('day'));
		const userTime = (DateTime.now().startOf('day'));
		convertTimestamp.timeZoneOffset = (new Date()).getTimezoneOffset() * 60_000 - (userTime - placeTime); // time zone offset in milliseconds
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
		formatData.normals = undefined;
		Tooltip.generateTextForecastData();
	}

	// forecast data provided
	if (fcst !== false) {
		// log the time of the forecast
		metaData.lastUpdate = Date.now();
		metaData.forecastTimestamp = fcst.properties.updateTime;

		// prepare and plot the data
		const dataset = prepForecastData(fcst, metaData, getOptions());
		if (formatData.normals) {
			dataset.push(...formatData.normals);
			formatData.normals = undefined;
		}
		plotData(dataset);

		saveOptions('visible', readVisibility(false, plot.getData()));

		// save text forecast data
		Tooltip.generateTextForecastData(fcst?.properties?.weather?.values);

		// clear the observation timeout handle
		clearTimeout(obsTimeoutHandle);

		// test for previously stored observations and plot it
		if (formatData.obs) formatData(false, formatData.obs);
		// test for previously stored normals and plot it
		if (formatData.normals) formatData(false, false, false, formatData.normals);
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
			obsTimeoutHandle = setTimeout(() => formatData(fcst, allObs, reset, false), 2000);
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
			plot = plotForecast([], emptyMetaData, plotLimits(metaData), inchAxes);
			chartVisibility(true);
			// indicate still loading
			document.querySelector('#date').classList.add('loading');
		}
		if (obs?.features?.length > 0) {
			const dataset = prepObsData(obs, metaData, getOptions());
			// update if temperature is available
			updateCurrentTemperature(dataset);
			// add the data to the plot
			const currentDataset = plot.getData();
			const obsRemoved = currentDataset.filter((d) => !d.isObs);
			obsRemoved.push(...dataset);
			// update minimums for scrolling
			// get plot limits
			const { endOfLast, oldestData } = plotLimits(metaData);
			plot.getOptions().xaxis.zoomRange = [11 * 60 * 60 * 1000, endOfLast - oldestData]; // 12 hours - range of data
			plot.getOptions().xaxis.panRange = [oldestData, endOfLast];
			plot.getAxes().xaxis.options.zoomRange = [11 * 60 * 60 * 1000, endOfLast - oldestData];
			plot.getAxes().xaxis.options.panRange = [oldestData, endOfLast];

			if (formatData.normals) {
				obsRemoved.push(...formatData.normals);
			}

			// redraw the plot
			plot.setData(obsRemoved);
			plot.setupGrid(true);
			plot.draw();

			// store text descriptions
			Tooltip.generateTextForecastData(allObs.data.features, true);
		} // obs != 0 (no data provided)
	} // observation data provided

	if (normals) {
		formatData.normals = normals;
	}
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

// store and format the normal temperatures received
const formatNormalTemperatures = (normals) => {
	formatData(false, false, false, normals);
};

const getPlotData = () => plot?.getData?.();

const init = () => {
	// get timezone for conversion
	convertTimestamp.timeZoneOffset = (new Date()).getTimezoneOffset() * 60_000; // time zone offset in milliseconds

	// catch window resize and update plot
	window.addEventListener('resize', windowResize);
	// and call it now to do the initial resize
	windowResize();

	Menu.registerClickHandler('menu-units', toggleUnits);
};

// init
document.addEventListener('DOMContentLoaded', () => init());

export {
	getInfo,
	formatData,
	setUnits,
	formatNormalTemperatures,
	getPlotData,
};
