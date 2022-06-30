import * as Menu from '../menu.mjs';
import {
	getSavedLocation, DEFAULT_PLACE, saveLocation,
} from '../placemanager.mjs';
import * as ProgressBar from '../progress.mjs';
import { fetchWithRetry, forEachElem } from '../utils.mjs';
import * as Table from '../table.mjs';
import * as Tooltip from '../tooltip.mjs';
import * as Alerts from '../alerts.mjs';
import * as Forecast from '../forecast.mjs';

let latLonReceivedCallback;
let positionReceivedCallback;

// init is called by parent module to provide latLonReceived
const init = (latLonReceived, positionReceived) => {
	// dialog interactions
	document.getElementById('locationSearch').addEventListener('keypress', locationSearchStart);
	document.querySelector('#dialog-location.dialog .close').addEventListener('click', hide);
	document.getElementById('followMe').parentNode.addEventListener('click', followMeToggle);
	// menu interactions
	Menu.registerClickHandler('menu-location-dialog', promptUser);
	Menu.registerClickHandler('menu-location-use-gps', setFollowMe);
	Menu.registerCloseAll(hide);
	// callbacks
	latLonReceivedCallback = latLonReceived;
	positionReceivedCallback = positionReceived;
};

// prompt user, public
// prompts user for location
const promptUser = () => {
	// hide the menu
	Menu.closeAll();

	// fill values
	document.getElementById('locationSearch').value = getSavedLocation().textSearch;
	setCheckbox(getSavedLocation().followMe);

	// show the dialog in stages to allow for the focus and select elements to work
	document.getElementById('dialog-location').classList.remove('initial-hide');
	setTimeout(() => {
		document.getElementById('dialog-location').classList.add('show');
		setTimeout(() => {
			const textBox = document.getElementById('locationSearch');
			textBox.focus();
			textBox.select();
		}, 100);
	}, 1);
};

const setCheckbox = (state) => {
	const checkbox = document.getElementById('followMe');
	if (state) {
		checkbox.classList.add('fa-check-square');
		checkbox.classList.remove('fa-square');
		return;
	}
	checkbox.classList.add('fa-square');
	checkbox.classList.remove('fa-check-square');
};

const locationSearchStart = async (e) => {
	// leave if enter was not pressed
	if (e.which !== 13) return;

	// close the dialog
	hide();

	ProgressBar.reset(e.currentTarget.value);
	const lookup = e.currentTarget.value;

	// close the menu bar
	Menu.closeAll();

	// skip lookup if cancelled
	if (!lookup) return;

	// hide the chart while updating
	Table.toggleTable(false);
	Forecast.chartVisibility(0);
	Tooltip.handler(false);
	Alerts.updateButtonState(true);

	// US is appended to search to help target the results
	const url = `https://nominatim.openstreetmap.org/search/${encodeURIComponent(`${lookup}`)}`;
	const data = { format: 'jsonv2', addressdetails: 1, countrycodes: 'us' };

	// get a default place to start from, (this will eliminate follow me)
	const place = { ...DEFAULT_PLACE };
	place.textSearch = lookup;

	const queryString = new URLSearchParams(data);

	geoCodeLocation(`${url}?${queryString}`, place);
};

const geoCodeLocation = async (url, place) => {
	// cancel previous request if present
	geoCodeLocation?.cancel?.();
	// look up data
	try {
		const fetchHandler = fetchWithRetry(url, 2, stillRetrying);
		geoCodeLocation.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Geocoding complete');
		latLonReceivedCallback(data, place);
	} catch (e) {
		ProgressBar.set('Unable to geocode', true);
		ProgressBar.message(e, true);
		stillRetrying(0, 2);
	}
};

const stillRetrying = (e, iteration) => {
	if (iteration === 2) {
		ProgressBar.set('Location lookup failed', true);
		forEachElem('#loading .centering>div', (elem) => elem.classList.add('error'));
	}
};

const hide = () => {
	document.getElementById('dialog-location').classList.remove('show');
};

const mustEnterPlaceName = () => {
	document.querySelector('#dialog-location .error').classList.add('show');
	document.getElementById('followMe').disabled = true;
	promptUser();
};

// follow me toggle, private
// switch the state of follow me and perform gps lookup if on
const followMeToggle = () => {
	const state = !getSavedLocation().followMe;
	setCheckbox(state);

	// save state
	const savedPlace = getSavedLocation();
	savedPlace.followMe = state;

	if (state) {
		// clear place name, it will be provided by gps lookup
		savedPlace.textSearch = null;
		// hide the chart while updating
		Table.toggleTable(false);
		Forecast.chartVisibility(0);
		Tooltip.handler(false);
		document.getElementById('location').innerHTML = 'Loading location...';
		// start lookup, save of place occurs at end of successful lookup
		navigator.geolocation.getCurrentPosition((position) => { positionReceivedCallback(position, savedPlace); });
		ProgressBar.reset('GPS');
		// close the dialog
		hide();
	} else {
		// save state of follow me immediately
		saveLocation(savedPlace);
		// dialog is not closed to allow the user to enter a location manually
	}
};

const setFollowMe = () => {
	// hide the menu and trigger the gps function
	hide();
	followMeToggle({ currentTarget: { checked: true } });
};

export {
	promptUser,
	hide,
	init,
	mustEnterPlaceName,
	setFollowMe,
};
