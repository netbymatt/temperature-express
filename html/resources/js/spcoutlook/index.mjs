import * as Menu from '../menu.mjs';
import * as ProgressBar from '../progress.mjs';
import { getFile, formatDay } from '../utils.mjs';
import testPolygon from './polygon.mjs';
import {
	hide, updateButtonState, buttonClick, showOutlook,
	showDetailOutlook,
	headerClick,
} from './dialog.mjs';

// red icons produced by the following categories
const redIconLabel = [
	'ENH',
	'MDT',
	'HIGH',
];

// list of interesting files ordered [0] = today, [1] = tomorrow...
const urlPattern = (day, type) => `/products/outlook/day${day}otlk_${type}.nolyr.geojson`;
const phenomenonTypes = {
	categorical: 'cat',
	tornado: 'torn',
	// sigTornado: 'sigtorn',
	hail: 'hail',
	// sigHail: 'sighail',
	wind: 'wind',
	// sigWind: 'sigwind',
};
// day three only has some files
const day3 = new Set(['categorical']);

// the data only needs to be loaded once per application load and is stored here, it covers the entire US
// undefined = data not loaded yet
// null = file not found, etc.
export const data = [];

// store the need to populate an initial load request or a detailed load request
// null = no load requested
// [lat,lon] = load requested at specified latitude and longitude
let initialLoadRequest = null;

// three days
const files = [null, null, null].map((v, i) => {
	const day = {};
	// build a blank data structure at the same time
	const dataDay = {};
	Object.entries(phenomenonTypes).forEach(([key, value]) => {
		if (i < 2 || day3.has(key)) {
			day[key] = urlPattern(i + 1, value);
			dataDay[key] = undefined;
		}
	});
	data.push(dataDay);
	return day;
});

const spcDayLink = (day) => `https://www.spc.noaa.gov/products/outlook/day${day}otlk.html`;

export const getRemainingData = async (daysToGet) => {
	await Promise.allSettled(data.map(async (day, index) => {
		if (!daysToGet[index]) return;
		const dayPromises = Object.entries(day).map(async ([key, value]) => {
			// if data is already present, no work to do
			if (value) return true;
			// no data present, fetch it
			const dayTypeData = await getFile(files[index][key]);
			data[index][key] = dayTypeData;
			return dayTypeData;
		});
		await Promise.allSettled(Object.values(dayPromises));
	}));
};

// sort the LABEL field where a label with text such as 'SIGN' is ranked higher than a numeric value
const labelSortAlgorithm = (a, b) => {
	const letterMatch = /[A-Za-z]{1,4}/;
	const aDN = letterMatch.test(a.LABEL) ? a.DN + 1 : a.DN;
	const bDN = letterMatch.test(b.LABEL) ? b.DN + 1 : b.DN;
	return bDN - aDN;
};

const testModerate = (days) => days.some((prevDay, day) => (day?.some?.((area) => redIconLabel.includes(area.LABEL)) ?? false));

const testAllPoints = (point, _types) => {
	// uses the stored data and fails soft (false) if data is not yet loaded
	// returns all points where the data matches as an array of days and then matches of the properties of the data

	// types can be specificed as a string, array of strings or defaults to all types
	let types = Object.keys(phenomenonTypes);
	if (Array.isArray(_types)) types = +types;
	if (typeof _types === 'string') types = [_types];

	const result = [];
	// start with a loop of days
	data.forEach((day, index) => {
		// initialize the result
		result[index] = false;
		// loop through each category
		Object.entries(day).forEach(([category, value]) => {
			// skip values that do not have data
			if (!value) return;
			// check for category match
			if (!types.includes(category)) return;
			// intermediate result, to be sorted by most significant
			const categoryResult = [];
			value.forEach((polygon) => {
				if (!polygon.geometry.coordinates) return;
				const inPolygon = testPolygon(point, polygon.geometry);
				if (inPolygon) categoryResult.push(polygon.properties);
			});
			if (categoryResult.length > 0) {
				if (!result[index]) result[index] = [];
				result[index].push(categoryResult.sort(labelSortAlgorithm)[0]);
			}
		});
	});

	return result;
};

export const analyzeDetailData = (position) => {
	// test all points
	const inside = testAllPoints(position);

	// test if any are moderate or above
	const isModerate = testModerate(inside);

	// see if we're inside any areas
	const isInside = inside.some((day) => day);
	// show the button
	updateButtonState(!isInside, isModerate);

	// build the dialog content
	const content = document.querySelector('#dialog-outlook .content');
	inside.forEach((day, index) => {
		const dayElements = [];
		// generate the heading
		const anchorElement = document.createElement('a');
		anchorElement.href = spcDayLink(index + 1);
		const headerElement = document.createElement('h3');
		anchorElement.append(headerElement);
		headerElement.textContent = formatDay(index);
		dayElements.push(anchorElement);

		// if the day is empty note that
		if (day) {
			const list = document.createElement('ul');
			// loop through the events
			// ugly way to get the categorical value first, and then sort by percent
			day.sort((a, b) => a.LABEL - b.LABEL).forEach((risk, i) => {
				const riskElem = document.createElement('li');
				if (i === 0) riskElem.textContent = 'Categorical: ';
				riskElem.textContent += risk.LABEL2;
				list.append(riskElem);
			});
			dayElements.push(list);
		} else {
			const noEvents = document.createElement('h4');
			noEvents.textContent = 'No SPC activity predicted';
			dayElements.push(noEvents);
		}
		// get the day element
		const dayElement = content.querySelector(`[data-day="${index + 1}"]`);
		dayElement.innerHTML = '';
		dayElement.append(...dayElements);
	});
};

export const analyzeInitialData = (_position) => {
	// if position is not provided get it from stored value
	const position = _position ?? initialLoadRequest;
	// clear the initial load request
	initialLoadRequest = null;

	// no position available, nothing to do
	if (!position) return;

	// test the point against the three categorical outlooks
	const inside = testAllPoints(position, 'categorical');

	initialLoadRequest = showDetailOutlook(position, inside, data, getRemainingData, analyzeDetailData, initialLoadRequest);
};

const init = async () => {
	// button interactivity
	document.querySelector('#outlook-button').addEventListener('click', buttonClick);
	document.querySelector('#dialog-outlook.dialog .close').addEventListener('click', hide);
	document.querySelector('#dialog-outlook .content').addEventListener('click', (e) => headerClick(e, data));

	Menu.registerClickHandler('menu-outlook', buttonClick);
	Menu.registerCloseAll(() => hide(true));

	// get the three categorical files to get started
	const initialData = await Promise.allSettled(files.map((fileGroup) => getFile(fileGroup.categorical)));
	// store the data, promise will always be fulfilled
	initialData.forEach((outlookDay, index) => {
		data[index].categorical = outlookDay.value;
	});

	// initial data has arrived
	// if there is a request for this data call the analyze function
	if (initialLoadRequest) analyzeInitialData();
};

// wrapper for show outlooks so errors within don't cause the entire forecast to fail
const showOutlookWrapper = (...args) => {
	try {
		initialLoadRequest = showOutlook(...args, data, analyzeInitialData);
	} catch (error) {
		ProgressBar.message('Error showing spc outlook', true);
		ProgressBar.message(error, true);
	}
};

// get spc outlook and display info
document.addEventListener('DOMContentLoaded', () => init());

export {
	showOutlookWrapper as show,
};
