import * as Menu from '../menu.mjs';
import {
	getSavedLocation, DEFAULT_PLACE, saveLocation,
} from '../placemanager.mjs';
import * as ProgressBar from '../progress.mjs';
import { fetchWithRetry, forEachElem, apiUrl } from '../utils.mjs';
import * as Table from '../table.mjs';
import * as Tooltip from '../tooltip.mjs';
import * as Alerts from '../alerts.mjs';
import * as Forecast from '../forecast.mjs';

let latLonReceivedCallback;
let positionReceivedCallback;

const LOCATION_SEARCH_SELECTOR = '#dialog-location';

// init is called by parent module to provide latLonReceived
const init = (latLonReceived, positionReceived) => {
	// dialog interactions
	document.querySelector(LOCATION_SEARCH_SELECTOR).addEventListener('keypress', locationSearchStart);
	document.querySelector('#dialog-location.dialog .close').addEventListener('click', hide);
	document.querySelector('#followMe').parentNode.addEventListener('click', followMeToggle);
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
	document.querySelector(LOCATION_SEARCH_SELECTOR).value = getSavedLocation().textSearch;
	setCheckbox(getSavedLocation().followMe);

	// show the dialog in stages to allow for the focus and select elements to work
	document.querySelector(LOCATION_SEARCH_SELECTOR).classList.remove('initial-hide');
	setTimeout(() => {
		document.querySelector(LOCATION_SEARCH_SELECTOR).classList.add('show');
		setTimeout(() => {
			const textBox = document.querySelector(LOCATION_SEARCH_SELECTOR);
			textBox.focus();
			textBox.select();
		}, 100);
	}, 1);
};

const setCheckbox = (state) => {
	const checkbox = document.querySelector('#followMe');
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

	ProgressBar.reset(e.target.value);
	const lookup = e.target.value;

	// close the menu bar
	Menu.closeAll();

	// skip lookup if cancelled
	if (!lookup) return;

	// hide the chart while updating
	Table.toggleTable(false);
	Forecast.chartVisibility(0);
	Tooltip.handler(false);
	Alerts.updateButtonState(true);

	// get a default place to start from, (this will eliminate follow me)
	const place = { ...DEFAULT_PLACE };
	place.textSearch = lookup;

	// look for the Kxxx pattern and try to look up that station directly
	const station = lookup.toUpperCase();
	if (/^K[A-Z]{3}$/.test(station)) {
		ProgressBar.message(`Looking up station directly: ${station}`);
		const stationLookup = await directStationLookup(lookup);
		if (stationLookup) {
			ProgressBar.message(`Found lookup station match: ${station}`);
			latLonReceivedCallback(stationLookup, place);
			return;
		}
	}

	// US is appended to search to help target the results
	const url = `https://nominatim.openstreetmap.org/search/${encodeURIComponent(lookup)}`;
	const data = { format: 'jsonv2', addressdetails: 1, countrycodes: 'us' };

	const queryString = new URLSearchParams(data);

	geoCodeLocation(`${url}?${queryString}`, place);
};

// one time direct station lookup, no retries for speed
const directStationLookup = async (stationId) => {
	try {
		// try to get the result
		const stationResponse = await fetch(`${apiUrl}stations/${stationId}`);
		if (!stationResponse.ok) {
			ProgressBar.message(`Station lookup failed ${stationId}: Network error`);
			return false;
		}

		// get the entire response
		const station = await stationResponse.json();

		// test for nws internal 404
		if (station?.status !== undefined) {
			ProgressBar.message(`Station lookup failed ${stationId}: ${station.status}`);
			return false;
		}

		// format for the correct response type
		return 		[
			{
				lat: station.geometry.coordinates[1],
				lon: station.geometry.coordinates[0],
			},
		];
	} catch (error) {
		ProgressBar.message(`Station lookup error: ${error.message}`);
		return false;
	}
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
	} catch (error) {
		ProgressBar.set('Unable to geocode', true);
		ProgressBar.message(error, true);
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
	document.querySelector(LOCATION_SEARCH_SELECTOR).classList.remove('show');
};

const mustEnterPlaceName = () => {
	document.querySelector('#dialog-location .error').classList.add('show');
	document.querySelector('#followMe').disabled = true;
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
		document.querySelector('#location').innerHTML = 'Loading location...';
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
	followMeToggle();
};

export {
	promptUser,
	hide,
	init,
	mustEnterPlaceName,
	setFollowMe,
};
