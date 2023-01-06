import * as ProgressBar from './progress.mjs';
import { apiUrl } from './utils.mjs';
import * as Menu from './menu.mjs';
import buildList from './alerts/buildlist.mjs';
import { byEvent, byImmediate } from './alerts/categorize.mjs';

// parse alerts data and display to user

// initialize on page load
document.addEventListener('DOMContentLoaded', () => init());

let isActive = false;	// active alerts present
let isError = false;	// error detected, show error strike-through
let hasWarningOrImmediate = false;	// at leastone item is a warning
const DIALOG_ALERT_SELECTOR = '#dialog-alert';

const init = () => {
	// setup the alert button
	document.querySelector('#alert-button').addEventListener('click', show);

	// alert dialog interactions, clicking headers expands/closes children
	document.querySelector(DIALOG_ALERT_SELECTOR).addEventListener('click', headingClick);
	document.querySelector('#dialog-alert.dialog .close').addEventListener('click', hide);
	Menu.registerClickHandler('menu-alerts', show);
	Menu.registerCloseAll(hide);
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

// test for any active alerts
const testActive = (data) => {
	// get current timestamp
	const now = Date.now();
	// loop through the data
	return Object.values(data).reduce((prev, type) => {
		// loop through each value
		// IMPORTANT: this loop cannot be collapsed to return prev || type.reduce as type.reduce sets properties for each individual alert
		const thisActive = type.reduce((acc, alert) => {
			// run test
			// used to include alert.expirems > now
			const alertActive = (alert.replacedBy === undefined && alert.expiresms > now && !alert.supersceded);
			// set a flag if it is active
			if (alertActive) {
				alert.isActive = true;
				type.isActive = true;
			}
			// set a flag if this is an immediate alert
			if (alert.urgency === 'Immediate') {
				alert.isImmediate = true;
				type.isImmediate = true;
			}
			// set a flag if this is a warning
			if (alert?.parameters?.VTEC?.[0]?.match(/\.[A-Z]{2}\.W\.\d{4}/)) {
				alert.isWarning = true;
				type.isWarning = true;
			}
			/* eslint-enable no-param-reassign */
			// return the test result
			return acc || alertActive;
		}, false);

		// update the global response
		return prev || thisActive;
	}, false);
};

// test for any active warnings
const testWarning = (categorized) => Object.values(categorized).reduce(
	(prevType, type) => (
		prevType || type.reduce(
			(prevAlert, alert) => prevAlert || !!(alert.isWarning && alert.isActive),
			false,
		)),
	false,
);

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

export {
	get, updateButtonState,
};
