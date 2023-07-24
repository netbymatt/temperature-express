import { getLineType, getPointType } from './config.mjs';
import { forEachElem } from './utils.mjs';
import { saveOptions } from './options.mjs';
import * as Menu from './menu.mjs';
import * as Forecast from './forecast.mjs';

const DIALOG_SELECTOR = '#dialog-legend';

document.addEventListener('DOMContentLoaded', () => {
	// dialog close buttons
	document.querySelector('#dialog-legend.dialog .close').addEventListener('click', hide);
	document.querySelector('#dialog-legend .touch-button').addEventListener('click', legendUpdate);

	Menu.registerClickHandler('menu-legend', menuClick);
	Menu.registerCloseAll(hide);
});

// legend click, private
// opens the legend editor dialog
const menuClick = () => {
	// some legends use the same name by design because a separate series exists for forecast vs observations
	// create an object with combined names so the end user can turn on and off both series at the same time
	const combined = {};
	// loop through the provided legends
	Forecast.getInfo('getData')().forEach((series) => {
		if (!combined[series.label]) {
			// new property, create the object
			combined[series.label] = {
				color: series.color,
				visible: series.lines.show,
			};
		}
	});

	// clear out the current legend
	const dialogContent = document.querySelector('#dialog-legend .content .keys');
	dialogContent.innerHTML = '';

	// get checkbox visibility
	const visible = Forecast.readVisibility(true);

	// build the checkboxes
	const checkboxes = Object.entries(combined).map(([key, val], i) => {
		const label = document.createElement('label');
		const colorBox = document.createElement('div');
		const checkbox = document.createElement('input');
		const text = document.createElement('div');

		label.classList.add('touch-button');

		colorBox.classList.add('color-box');
		colorBox.id = `legend-color-box-${i}`;
		colorBox.style.backgroundColor = val.color;

		checkbox.type = 'checkbox';
		checkbox.id = `legend-${i}`;
		checkbox.value = key;
		checkbox.checked = visible[key];

		text.textContent = key;

		label.append(checkbox, colorBox, text);
		return label;
	});

	// add checkboxes to page
	dialogContent.append(...checkboxes);

	// show the dialog
	document.querySelector(DIALOG_SELECTOR).classList.remove('initial-hide');
	setTimeout(() => document.querySelector(DIALOG_SELECTOR).classList.add('show'));
};

// close the legend dialog
const hide = () => {
	document.querySelector(DIALOG_SELECTOR).classList.remove('show');
};

// legend update, private
// read through checkboxes on legend display and update visible array
const legendUpdate = () => {
	// grab the current data
	const dataset = Forecast.getInfo('getData')();
	// make a quick lookup array of values
	const visible = {};
	forEachElem('#dialog-legend input[type=checkbox]', (element) => {
		visible[element.value] = element.checked;
	});

	// loop through each series and assign visibility
	dataset.forEach((series, i) => {
		// determine on/off state
		if (visible[series.label]) {
			// get default line type
			dataset[i].lines = getLineType(series.lineType, series.label, true);
			dataset[i].points = getPointType(series.lineType, series.label, true);
		} else {
			// turn off
			dataset[i].lines.fill = false;
			dataset[i].lines.show = false;
			dataset[i].points.show = false;
		}
	});

	// update the plot
	Forecast.getInfo('setData')(dataset);
	Forecast.getInfo('draw')();
	// store the new options
	saveOptions('visible', Forecast.readVisibility(true));
	// close the dialog
	hide();
};
