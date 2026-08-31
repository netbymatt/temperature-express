import { DateTime } from '../../vendor/auto/luxon.mjs';
import * as ProgressBar from '../progress.mjs';
import { fetchWithRetry, apiUrl } from '../utils.mjs';
import { getOptions, saveOptions } from '../options.mjs';
import * as Menu from '../menu.mjs';
import * as Forecast from '../forecast/forecast.mjs';

// getPlace is provided by the parent module via init() instead of being imported directly
// (location.mjs pulls in this module indirectly, so importing it here would create a dependency cycle)
let getPlaceCallback;

const get = async (place) => {
	let data = {};
	// cancel previous request if present
	get?.cancel?.();
	// calculate 7 days of observations
	const startDate = DateTime.local().minus({ days: 7 }).startOf('day').toISO({ suppressMilliseconds: true });
	// get the observation history for the station
	let next = `${apiUrl}stations/${place.station}/observations?start=${startDate}`;
	while (next) {
		try {
			const fetchHandler = fetchWithRetry(next, 3);
			get.cancel = fetchHandler.cancel;
			// eslint-disable-next-line no-await-in-loop
			const pageData = await fetchHandler.data;
			if (!data.features) {
				// first pass
				data = pageData;
			} else {
				data.features.push(...pageData.features);
			}
			next = pageData.pagination.next;
		} catch {
			// see if the other data arrived
			ProgressBar.set('Get observations failed!', true);
			Forecast.formatData(false, 0);	// special "no data present case"
			return;
		}
		Forecast.formatData(false, { data, station: place.station });
	}
};

const updateMenuButton = () => {
	// get the state
	const { highFrequency } = getOptions();

	// get interesting elements
	const elemHigh = document.querySelector('.side-menu .update-high');
	const elemStandard = document.querySelector('.side-menu .update-standard');

	if (highFrequency) {
		// show the high frequency div
		elemStandard.style.display = 'none';
		elemHigh.style.display = 'block';
	} else {
		// show the standard div
		elemStandard.style.display = 'block';
		elemHigh.style.display = 'none';
	}
};

const toggleButton = () => {
	// get the current state
	const { highFrequency } = getOptions();

	// toggle and save the state
	saveOptions('highFrequency', !highFrequency);

	// update the menu button
	updateMenuButton();

	// redraw the plot
	getPlaceCallback();
};

// init is called by parent module to provide getPlace
const init = (getPlace) => {
	getPlaceCallback = getPlace;
};

document.addEventListener('DOMContentLoaded', () => {
	Menu.registerClickHandler('menu-high-frequency', toggleButton);
	// set the initial state of the menu button
	updateMenuButton();
});

export {
	get,
	init,
};
