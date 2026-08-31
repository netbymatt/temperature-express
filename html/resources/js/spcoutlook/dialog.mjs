import * as Menu from '../menu.mjs';

import * as Map from './map.mjs';

import { DIALOG_OUTLOOK_SELECTOR } from '../config.mjs';

// update button state
export const updateButtonState = (hide, isModerate) => {
	const outlookButton = document.querySelector('#outlook-button');
	if (hide) {
		outlookButton.classList.remove('show', 'red');
	} else {
		outlookButton.classList.add('show');
		if (isModerate) outlookButton.classList.add('red');
	}
};
export const buttonClick = () => {
	Menu.closeAll();
	// open the dialog
	document.querySelector(DIALOG_OUTLOOK_SELECTOR).classList.remove('initial-hide');
	setTimeout(() => document.querySelector(DIALOG_OUTLOOK_SELECTOR).classList.add('show'), 1);

	// hide other dialogs
	Map.hide();
};

export const hide = (andMap) => {
	document.querySelector(DIALOG_OUTLOOK_SELECTOR).classList.remove('show');
	if (andMap) Map.hide();
};// show the outlook data at the specificed ([lat,lon])

export const showOutlook = (position, data, analyzeInitialData, _initialLoadRequest) => {
	let initialLoadRequest = _initialLoadRequest;
	// hide the buttons
	updateButtonState(true);
	// if there's already a position in the queue remove it. This should only be called once per lat/lon change
	if (initialLoadRequest) {
		// set higher-level initialLoadRequest via return
		initialLoadRequest = null;
	}

	// determine if all initial data is present
	if (data[0].categorical !== undefined && data[1].categorical !== undefined && data[2].categorical !== undefined) {
		// initial data is present, analyze it
		analyzeInitialData(position);
	} else {
		// queue it for later
		initialLoadRequest = position;
	}
	return initialLoadRequest;
};

export const showDetailOutlook = async (position, daysToGet, data, getRemainingData, analyzeDetailData, _initialLoadRequest) => {
	let initialLoadRequest = _initialLoadRequest;
	// if there's already a position in the queue remove it. This should only be called once per lat/lon change
	if (initialLoadRequest) {
		initialLoadRequest = null;
	}

	// determine if all detail data is present
	const allDataPresent = data.every((day, dayIndex) => (!daysToGet[dayIndex] || Object.values(day).every((cur) => (cur !== undefined))));
	if (!allDataPresent) {
		await getRemainingData(daysToGet);
	}
	analyzeDetailData(position);
	return initialLoadRequest;
};

// heading clicks open the corresponding maps
export const headerClick = (e, data) => {
	if (e.target.tagName !== 'H3') return;
	// don't follow the link
	e.preventDefault();
	// test for data on this day (note programmers call today 0 and the spc calls it day 1)
	const rawDay = (e.target.parentNode.parentNode.dataset.day);
	if (!rawDay) return;
	const day = +rawDay - 1;
	if (!data[day]) return;

	// load the map dialog and close the outlook dialog
	Map.show(day);
	hide();
};
