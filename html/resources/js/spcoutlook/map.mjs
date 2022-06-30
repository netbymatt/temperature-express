import { formatDay } from '../utils.mjs';

document.addEventListener('DOMContentLoaded', () => init());

const init = () => {
	document.querySelector('#dialog-outlook-map.dialog .close').addEventListener('click', hide);
	document.querySelector('#dialog-outlook-map-navigation').addEventListener('click', changeMapDay);
};

const hide = () => {
	document.querySelector('#dialog-outlook-map').classList.remove('show');
};

// day is zero based
const show = (day) => {
	// close the initial popup
	hide();
	// set the day
	const dialog = document.getElementById('dialog-outlook-map');
	dialog.dataset.currentDay = day;
	const titleElem = dialog.querySelector('.dialog .title div');
	titleElem.innerHTML = titleElem.innerHTML.replace(/(\d)/, day + 1).replace(/(: ).*/, `$1${formatDay(day)}`);

	// set the image
	dialog.querySelector('img').src = spcImageLink(day + 1);

	// set up next/previous buttons
	const next = document.querySelector('#dialog-outlook-map-navigation .right');
	const previous = document.querySelector('#dialog-outlook-map-navigation .left');
	previous.disabled = day <= 0;
	next.disabled = day >= 7;
	next.dataset.newDay = day + 1;
	previous.dataset.newDay = day - 1;

	// open the dialog
	dialog.classList.remove('initial-hide');
	setTimeout(() => dialog.classList.add('show'), 1);
};

const changeMapDay = (e) => {
	const { dataset } = e.target;
	if (!dataset?.newDay) return;

	const newDay = +dataset.newDay;

	// test for valid day
	if (newDay < 0 || newDay > 7) return;

	// test for disabled
	if (e.target.disabled) return;

	// load the new day
	show(newDay);
};

const spcImageLink = (day) => {
	if (day <= 3) return `https://www.spc.noaa.gov/products/outlook/day${day}otlk.gif`;
	return `https://www.spc.noaa.gov/products/exper/day4-8/day${day}prob.gif`;
};

export {
	hide,
	show,
};
