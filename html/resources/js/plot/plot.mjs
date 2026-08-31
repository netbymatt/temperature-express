import TickFormatter from './tickformatter.mjs';
import bgMarkingsGenerator from './bgmarkings.mjs';
import { dark } from '../utils.mjs';
import { getOptions } from '../options.mjs';
import plotDays from './plotDays.mjs';
import { plot } from '../../vendor/auto/flot.mjs';

const plotForecast = (dataset, metaData, plotLimits, inchAxes) => {
	const { beginningOfFirst, endOfLast, oldestData } = plotLimits;
	// we want the width of the plot to show at least 3 days and more if the width of the browser allows
	// calculate width of window
	const availableWidth = window.innerWidth;
	const smallestDay = availableWidth / 3;
	// if smallest day is less than 100px, no change, otherwise add a scaling factor to the default time
	// also limit to the end of the last day
	const startupXMax = Math.min(beginningOfFirst + 3 * 24 * 60 * 60 * 1000 * Math.max(smallestDay / 150, 1), endOfLast);

	// get limits for the "inch" axes in the proper units
	const inAxes = inchAxes(getOptions().units);

	const tickColor = (dark()) ? '#606060' : undefined;
	const gridColor = (dark()) ? '#808080' : undefined;

	const bgMarkings = bgMarkingsGenerator(metaData);

	return plot(
		'#chart',
		dataset,

		// start of options
		{
			series: {
				shadowSize: 0,
			},
			xaxis: {
				mode: 'time',
				tickFormatter: TickFormatter,
				zoomRange: [11 * 60 * 60 * 1000, endOfLast - oldestData], // 12 hours - range of data
				panRange: [oldestData, endOfLast],
				min: beginningOfFirst,
				max: startupXMax,
				autoScale: 'none',
				timeBase: 'milliseconds',
				axisZoom: true,
				plotZoom: true,
				axisPan: true,
				plotPan: true,
				color: tickColor,
			},
			yaxis: {
				axisZoom: false,
				plotZoom: false,
				axisPan: false,
				plotPan: false,
				color: tickColor,
			},
			yaxes: [
				{	// axis 1, temperature
					panRange: false,
					zoomRange: false,
					position: 'right',
				},
				{	// axis 2, %
					position: 'left',
					min: 0,
					max: 100,
					autoScale: 'none',
					show: false,
					panRange: false,
					zoomRange: false,
				},
				{	// axis 3, in (snow)
					position: 'left',
					min: inAxes.y3.min,
					max: inAxes.y3.max,
					autoScale: 'none',
					show: false,
					panRange: false,
					zoomRange: false,
				},
				{	// axis 4, in / 10 (intended for ice accumulation)
					position: 'left',
					min: inAxes.y4.min,
					max: inAxes.y4.max,
					autoScale: 'none',
					show: false,
					panRange: false,
					zoomRange: false,
				},
				{	// axis 5, barometer
					position: 'left',
					min: inAxes.y5.min,
					max: inAxes.y5.max,
					autoScale: 'none',
					show: false,
					panRange: false,
					zoomRange: false,
				},
				{
					// axis 6, lightning
					position: 'left',
					min: 0,
					max: 20,
					autoScale: 'none',
					show: false,
					panRange: false,
					zoomRange: false,
				},
				{	// axis 7, in / 5 (intended for rain)
					position: 'left',
					min: inAxes.y7.min,
					max: inAxes.y7.max,
					autoScale: 'none',
					show: false,
					panRange: false,
					zoomRange: false,
				},
			],
			zoom: {
				interactive: true,
				active: true,
				amount: 1.5,
				enableTouch: true,
			},
			pan: {
				interactive: true,
				active: true,
				cursor: 'move',
				frameRate: 60,
				mode: 'smart',
				enableTouch: true,
			},
			grid: {
				hoverable: true,
				clickable: true,
				markings: bgMarkings,
				color: gridColor,
			},
			legend: {
				show: false,
			},
			hooks: {
				draw: [plotDays],
			},
			direction: { // wind speed plot only
				show: true,
				disablePoints: true,
				lineWidth: 1,
				color: 'rgb(100, 60, 60)',
				fillColor: 'rgb(100, 60, 60)',
				arrowLength: 4,
				angleType: 'degree', // degree or radian
				openAngle: 20,
			},
		},
	);
};

export default plotForecast;
