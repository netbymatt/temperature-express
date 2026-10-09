import * as ProgressBar from '../progress.mjs';
import { DateTime } from '../../vendor/auto/luxon.mjs';
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
let obsTimeoutHandle = null; // delays drawing observations to give the forecast a chance to load first

// most recent data received from each source, which can arrive in any order
const received = {
	fcst: null, // raw forecast
	obs: null, // { data, station } raw observations
	normals: null, // prepared normals series, drawn once forecast or observations are on the plot
};

// recalculate time zone offset from the saved location
const updateTimeZone = () => {
	const { timeZone } = getSavedLocation();
	if (!timeZone) return;
	const placeTime = (DateTime.now().setZone(timeZone).startOf('day'));
	const userTime = (DateTime.now().startOf('day'));
	convertTimestamp.timeZoneOffset = (new Date()).getTimezoneOffset() * 60_000 - (userTime - placeTime); // time zone offset in milliseconds
};

// strip flot's internal properties so a series from one plot can be used to create another
const toPlainSeries = ({
	datapoints, xaxis, yaxis, ...series
}) => ({ ...series, yaxis: yaxis?.n ?? yaxis });

// normals already on the plot (preserving any unit conversion) or waiting to be drawn
const currentNormals = () => {
	const plotted = plot?.getData().filter((series) => series.isNorm) ?? [];
	if (plotted.length > 0) return plotted.map((series) => toPlainSeries(series));
	return received.normals ?? [];
};

// prepare the observation series from the most recently received observations
const prepObs = () => {
	if (!(received.obs?.data?.features?.length > 0)) return [];
	return prepObsData(received.obs.data, metaData, getOptions());
};

// rebuild the tooltip text from all received data
const updateTextForecastData = () => {
	Tooltip.generateTextForecastData();
	Tooltip.generateTextForecastData(received.fcst?.properties?.weather?.values);
	if (received.obs?.data?.features?.length > 0) Tooltip.generateTextForecastData(received.obs.data.features, true);
};

// create a new plot, replacing any existing plot
const createPlot = (dataset, plotMetaData) => {
	plot?.shutdown();
	plot = plotForecast(dataset, plotMetaData, plotLimits(metaData), inchAxes);
	chartVisibility(true);
};

// replace the plot's data and update the scrolling limits
const updatePlot = (dataset) => {
	const { endOfLast, oldestData } = plotLimits(metaData);
	const zoomRange = [11 * 60 * 60 * 1000, endOfLast - oldestData]; // 12 hours - range of data
	const panRange = [oldestData, endOfLast];
	plot.getOptions().xaxis.zoomRange = zoomRange;
	plot.getOptions().xaxis.panRange = panRange;
	plot.getAxes().xaxis.options.zoomRange = zoomRange;
	plot.getAxes().xaxis.options.panRange = panRange;

	plot.setData(dataset);
	plot.setupGrid(true);
	plot.draw();
};

// clear out all stored data, public
// called when the location changes
const reset = () => {
	plot?.shutdown();
	plot = null;
	clearTimeout(obsTimeoutHandle);
	obsTimeoutHandle = null;
	received.fcst = null;
	received.obs = null;
	received.normals = null;
	metaData.minTimestamp = null;
	metaData.maxTimestamp = null;
	metaData.oldestData = null;
	updateTimeZone();
	Tooltip.generateTextForecastData();
};

// forecast received, public
// the plot is always recreated so the time limits match the new forecast
const setForecast = (fcst) => {
	updateTimeZone();
	// any delayed observations are included below
	clearTimeout(obsTimeoutHandle);
	obsTimeoutHandle = null;
	received.fcst = fcst;

	// log the time of the forecast
	metaData.lastUpdate = Date.now();
	metaData.forecastTimestamp = fcst.properties.updateTime;

	// forecast first, observations may extend oldestData further back
	const dataset = [
		...prepForecastData(fcst, metaData, getOptions()),
		...prepObs(),
		...currentNormals(),
	];
	createPlot(dataset, metaData);

	saveOptions('visible', readVisibility(false, plot.getData()));
	updateTextForecastData();
};

// draw the stored observations, creating the plot if the forecast hasn't arrived yet
const drawObservations = () => {
	const obsDataset = prepObs();
	updateCurrentTemperature(obsDataset);

	if (plot) {
		// swap out the previous observations, keep forecast and normals
		updatePlot([...plot.getData().filter((series) => !series.isObs), ...obsDataset]);
	} else {
		// forecast hasn't arrived yet, show what's available
		const emptyMetaData = {
			minTimestamp: DateTime.now().startOf('day'),
			maxTimestamp: DateTime.now().plus({ days: 7 }).endOf('day'),
		};
		createPlot([...obsDataset, ...currentNormals()], emptyMetaData);
		// indicate still loading
		document.querySelector('#date').classList.add('loading');
	}

	updateTextForecastData();
};

// observations received, public
// allObs = { data, station }, or null if observations are not available
const setObservations = (allObs) => {
	updateTimeZone();
	if (allObs) {
		received.obs = allObs;
		ProgressBar.set('Observations received');
		document.querySelector('#menu-footer-site').innerHTML = allObs.station;
	}

	if (plot) {
		drawObservations();
		return;
	}

	// intentional 2 second delay to allow forecast to load first
	// this creates a much nicer loading fade in
	// additional pages received during the delay are stored and drawn when it expires
	obsTimeoutHandle ??= setTimeout(() => {
		obsTimeoutHandle = null;
		drawObservations();
	}, 2000);
};

// normal temperatures received, public
// held until forecast or observations are on the plot
const setNormals = (normals) => {
	received.normals = normals;
	if (!plot) return;
	updatePlot([...plot.getData().filter((series) => !series.isNorm), ...normals]);
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
	reset,
	setForecast,
	setObservations,
	setNormals,
	setUnits,
	getPlotData,
};
