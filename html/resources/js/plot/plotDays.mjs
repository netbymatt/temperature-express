import HolidayIcon from './holidays.mjs';
import { DateTime } from '../../vendor/luxon.mjs';

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
		const icon = HolidayIcon(activeDay);

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

export default plotDays;
