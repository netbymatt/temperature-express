import * as ProgressBar from '../progress.mjs';
import { apiUrl } from '../utils.mjs';
import * as Menu from '../menu.mjs';
import buildList from './buildlist.mjs';
import { byEvent, byImmediate } from './categorize.mjs';
import testActive from './testActive.mjs';
import testWarning from './testWarning.mjs';

// parse alerts data and display to user

let isActive = false;	// active alerts present
let isError = false;	// error detected, show error strike-through
let hasWarningOrImmediate = false;	// at leastone item is a warning
const DIALOG_ALERT_SELECTOR = '#dialog-alert';

// update button state
const updateButtonState = (hide) => {
	const alertButton = document.querySelector('#alert-button');
	if ((isActive || isError) && !hide) {
		alertButton.classList.add('show');
		if (isError) alertButton.classList.add('disabled');
		if (hasWarningOrImmediate) alertButton.classList.add('red');
	} else {
		alertButton.classList.remove('show', 'disabled', 'red');
	}
};

// show the alert dialog
const alertButton = () => {
	// build the alert list
	const dialog = document.querySelector(DIALOG_ALERT_SELECTOR);
	const dialogContent = document.querySelector('#dialog-alert-content');
	// check for error state
	if (isError) {
		dialogContent.innerHTML = 'Alerts could not be loaded for this location';
	} else {
		// order is intentional with the most important items first
		dialogContent.innerHTML = '';
		dialogContent.append(
			...buildList(alertButton.data.immediate, true),
			...buildList(alertButton.data.active, true),
			...buildList(alertButton.data.immediateInactive, false),
			...buildList(alertButton.data.inactive, false),
		);
	}

	// open the dialog
	dialog.classList.remove('initial-hide');
	setTimeout(() => dialog.classList.add('show'), 1);
};

// categorize the alerts for easier management and to prevent user overload
const received = (json) => {
	// update progress bar
	ProgressBar.set('Alerts received');
	const categorized = byEvent(json);
	// sort the data in each category

	const sorted = Object.fromEntries(Object.entries(categorized).map(([category, alertList]) => [category, alertList.sort((a, b) => b.effectivems - a.effectivems)]));
	// test for active alerts
	isActive = testActive(sorted);
	isError = false;
	hasWarningOrImmediate = testWarning(sorted);

	// categorize by immediate
	const immediate = byImmediate(sorted);

	// show the alert icon if there is an alert
	updateButtonState();
	// set the alert data
	alertButton.data = immediate;
};

// get alerts
const get = async (place, isRetry) => {
	// hide the button while loading
	updateButtonState(true);
	try {
		const response = await fetch(
			`${apiUrl}alerts?status=actual&point=${(+place.lat.toFixed(4)).toString()},${(+place.lon.toFixed(4)).toString()}`,
		);
		if (response.status !== 200) throw new Error(`Response status code: ${response.status}`);
		const json = await response.json();
		received(json);
	} catch (error) {
		if (isRetry) {
			ProgressBar.message('Get alerts failed!', true);
			ProgressBar.message(error, true);
			ProgressBar.set('Get alerts failed', true);
			// update button state
			isActive = false;
			isError = true;
			hasWarningOrImmediate = false;
			updateButtonState();
		} else {
			// try again one time
			setTimeout(() => get(place, true), 1000);
		}
	}
};

const hide = () => {
	document.querySelector(DIALOG_ALERT_SELECTOR).classList.remove('show');
};

// clicked on h3 or h4 element in dialog
const headingClick = (e) => {
	// only hide/collapse h3 and h4
	if (['H3', 'H4'].includes(e.target.tagName)) {
		e.target.nextElementSibling.classList.toggle('hidden');
		e.stopPropagation();
	}
};

// show the alert window
const show = () => {
	Menu.closeAll();
	alertButton();
};

const init = () => {
	// setup the alert button
	document.querySelector('#alert-button').addEventListener('click', show);

	// alert dialog interactions, clicking headers expands/closes children
	document.querySelector(DIALOG_ALERT_SELECTOR).addEventListener('click', headingClick);
	document.querySelector('#dialog-alert.dialog .close').addEventListener('click', hide);
	Menu.registerClickHandler('menu-alerts', show);
	Menu.registerCloseAll(hide);
};

// initialize on page load
document.addEventListener('DOMContentLoaded', () => init());

export {
	get, updateButtonState,
};
