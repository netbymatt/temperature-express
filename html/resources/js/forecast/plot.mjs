import TickFormatter from './tickformatter.mjs';
import bgMarkingsGenerator from './bgmarkings.mjs';
import { dark } from '../utils.mjs';
import { getOptions } from '../options.mjs';
import Holidays from './holidays.mjs';
import { DateTime } from '../../vendor/luxon.min.mjs';

const plot = (dataset, metaData, plotLimits, inchAxes) => {
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

	return $.plot(
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

// plot days, private
// plot days in the chart for easier readability
const plotDays = (plt) => {
	// get some elements
	const label = document.querySelector('.day').cloneNode(true);
	let container = document.querySelector('.days');
	if (!container) {
		const days = document.createElement('div');
		days.classList.add('days');
		document.querySelector('#chart').append(days);
		container = document.querySelector('.days');
	}
	const { xaxis } = plt.getAxes();

	// determine start of day on first plotted day
	let activeDay = DateTime.fromMillis(plt.getAxes().xaxis.min, { zone: 'UTC' }).startOf('day');
	// get the width of one day in pixels
	const dayWidth = xaxis.p2c(activeDay.plus({ days: 1 }).toMillis()) - xaxis.p2c(activeDay.toMillis());

	// position calculation
	const { top, left } = plt.getPlotOffset();

	// add the bounding box
	// update the position
	container.style.top = `${top}px`;
	container.style.left = `${left}px`;
	container.style.width = `${plt.width()}px`;

	// loop through all days
	const days = [];
	let xLeft = null;
	while (activeDay.toMillis() < plt.getAxes().xaxis.max) {
		// calculate plotting coordinates using y axis 2 which is scaled in percent
		if (xLeft === null) xLeft = xaxis.p2c(activeDay.toMillis());

		// get an icon if present
		const icon = holidayIcon(activeDay);

		// clone the base element and put it on the chart
		const today = label.cloneNode(true);
		today.style.left = `${xLeft}px`;
		today.style.width = `${dayWidth}px`;
		today.innerHTML = activeDay.toLocaleString({ weekday: 'long' }) + icon;

		// store the element
		days.push(today);

		// increment activeDay to next day
		activeDay = activeDay.plus({ day: 1 });
	}
	// update element on page
	container.innerHTML = '';
	container.append(...days);
};

// holiday icon lookup
const holidayIcon = (day) => {
	const icon = Holidays(day);

	// extract icon type and title text (or default)
	const iconType = icon?.[0] ?? icon;
	const iconTitle = icon?.[1] ?? '';
	return icon ? `<i class="fas fa-${iconType}" title="${iconTitle}"></i>` : '';
};

export default plot;
