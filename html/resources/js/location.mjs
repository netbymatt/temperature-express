// these functions get lat-long as well as follow me populated, and detailed forecast information
import { DateTime } from '../vendor/luxon.min.mjs';
import {
	forEachElem, apiUrl, fetchWithRetry, backoff,
} from './utils.mjs';
import {
	getSavedLocation, getSavedPlaces, saveLocation,
} from './placemanager.mjs';
import * as ProgressBar from './progress.mjs';
import * as Menu from './menu.mjs';
import * as Forecast from './forecast.mjs';
import * as Outlook from './spcoutlook.mjs';
import * as Table from './table.mjs';
import * as Alerts from './alerts.mjs';
import * as Dialog from './location/dialog.mjs';

document.addEventListener('DOMContentLoaded', () => {
	// set up dialog controls
	document.querySelector('#retry-forecast').addEventListener('click', retryForecast);
	document.querySelector('#dialog-messages-retry').addEventListener('click', retryForecast);
	Menu.registerClickHandler('menu-prev-locations', historyClick);

	// catch foreground/background changes
	document.addEventListener('visibilitychange', visibilityChange);

	// register the latlon received callback
	Dialog.init(latLonReceived, positionReceived);

	// start the lookup
	getPlace();
});

const retryForecast = () => {
	Forecast.chartVisibility(false);
	getPlace();
};

const getPlace = (isRetry) => {
	// get a saved location, always returns correct structure, data is null if no saved data
	const savedPlace = getSavedLocation();

	// examine saved info
	if (savedPlace.followMe) {
		ProgressBar.reset('Follow me');
		// get latitude and longitude from GPS
		navigator.geolocation.getCurrentPosition(
			(position) => { positionReceived(position, savedPlace); },
			(e) => getPlaceFailed(e, isRetry),
			{ enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 },
		);
	} else if (savedPlace.pointX === null) {
		// something is missing, prompt the user
		ProgressBar.reset('Needs user input');
		Dialog.promptUser();
	} else {
		ProgressBar.reset(`Point: ${savedPlace.office} ${savedPlace.pointX}, ${savedPlace.pointY}`);
		// pass saved location to getForecast
		// format the data as expected by the function
		ProgressBar.set('Using saved point');
		Outlook.show([savedPlace.lon, savedPlace.lat]);
		pointReceived(false, savedPlace);
	}
};

// const geoloc error
const getPlaceFailed = (e, isRetry) => {
	ProgressBar.message('Geolocation lookup failed', true);
	ProgressBar.message(e, true);
	switch (e.code ?? 0) {
	case 1:
		// user denied
		// turn off gps option on location screen and force a user input
		Dialog.mustEnterPlaceName();
		break;
		// position unavailable (internal position source failed)
		// intentional fall-through to "force user input" below
	case 2:
	case 3:
		// timeout expired
		// retry once then force user to enter a location
		if (isRetry) {
			Dialog.mustEnterPlaceName();
		} else {
			getPlace(true);
		}
		break;
	default:
	}
};

// position received, private
// device based position received
const positionReceived = (position, place) => {
	ProgressBar.set('Location acquired');
	ProgressBar.message(`${position.coords.latitude.toFixed(2)} ${position.coords.longitude.toFixed(2)}`, 'no-copy');
	document.querySelector('#dialog-location .error').classList.remove('show');
	document.querySelector('#followMe').disabled = false;
	Dialog.hide();
	// pass to latLogReceived in correct format
	latLonReceived(
		[
			{
				lat: position.coords.latitude,
				lon: position.coords.longitude,
			},
		],
		place,
	);
};

// react to clicking the location history button
const historyClick = (e) => {
	// grab the history index
	const index = e?.target?.dataset?.index;
	if (!index) return;

	// get the associated place
	const newPlace = getSavedPlaces()[+index];

	// turn off follow me
	newPlace.followMe = false;

	// hide the chart during loading
	Forecast.chartVisibility(false);

	// save it as the current place
	saveLocation(newPlace);
	// load the location
	getPlace();
	Table.toggleTable(false, false);
	// close the dialog
	Dialog.hide();
	Menu.closeAll();
};

// location received, private
// extract latitude and longitude
const latLonReceived = (places, _place) => {
	const place = { ..._place };
	// returns an array of closest matches
	if (places.length > 0) {
		// extract new latitude an longitude
		const newLat = parseFloat(places[0].lat);
		const newLon = parseFloat(places[0].lon);
		// if less than 0.01 from previous location forgo location lookup and use cached point
		if (Math.abs(newLat - place.lat) <= 0.01 && Math.abs(newLon - place.lon) <= 0.01
				&& place.pointX !== null && pointReceived.placeY !== null) {
			Outlook.show([place.lon, place.lat]);
			// jump to point received
			pointReceived(false, place);
		} else {
			// store location and get point
			place.lat = parseFloat(places[0].lat);
			place.lon = parseFloat(places[0].lon);
			// attempt to get a place name from the returned values
			place.name = formatPlaceName(places[0].address);
			getPoint(place);
		}
	} else {
		// prompt user that the place search returned no results
		showError('Error', 'We couldn\'t find this location:', place.textSearch);
	}
};

// hierarchical place name extraction
const formatPlaceName = (address) => {
	// no address is provided if lat/lon are used for coordinates
	if (!address) return null;
	const city = address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.hamlet ?? address.county ?? '';
	const { state } = address;
	if (!state) return city;
	return `${city}, ${state}`;
};

// get point, private
// updates the place structure with a point looked up from latitude and longitude
const getPoint = async (_place) => {
	const place = { ..._place };
	Outlook.show([place.lon, place.lat]);
	if (place.lat === null || place.lon === null) return;

	// clear out existing data
	place.pointX = null;
	place.pointY = null;
	place.office = null;
	place.pointInfo = null;
	// remove trailing zeros from place per api specification
	const url = `${apiUrl}points/${(+place.lat.toFixed(4)).toString()},${(+place.lon.toFixed(4)).toString()}`;

	// cancel previous request if present
	getPoint?.cancel?.();
	// look up data
	try {
		const fetchHandler = fetchWithRetry(url, 2, stillRetrying);
		getPoint.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Geocoding complete');
		pointReceived(data, place);
	} catch (error) {
		ProgressBar.set('Could not get point from NWS', 10, true);
		ProgressBar.message(error, true);
	}
};

// point received, private
// received point data, update data structure
// get hourly forecast, text forecast and list of nearest stations
const pointReceived = (point, _place) => {
	const place = { ..._place };
	// if json was provided store new values
	if (point) {
		place.pointX = point.properties.gridX;
		place.pointY = point.properties.gridY;
		place.office = point.properties.cwa;
		// only update the name if it was not populated by the open street map lookup
		place.name = place.name ?? `${point.properties.relativeLocation.properties.city}, ${point.properties.relativeLocation.properties.state}`;
		place.pointInfo = point;
		place.timeZone = point.properties.timeZone;
	}
	ProgressBar.set(`NWS point received ${place.office}:${place.pointX},${place.pointY}`);

	// fill out title
	// add a map marker if using follow me
	let html = place.name;
	if (place.followMe) {
		html = `<i class="fas fa-map-marked"></i>${html}`;
	}
	document.querySelector('#location').innerHTML = html;

	// fill text search name with nice name from nws if using gps location
	if (!place.textSearch) {
		place.textSearch = place.name;
	}

	saveLocation(place);

	// clear any stored data on the plot and hide the alert icon
	Forecast.formatData(false, false, true);
	Alerts.updateButtonState(true);

	// calculate base url
	const baseUrl = `${apiUrl}gridpoints/${place.office}/${place.pointX},${place.pointY}`;

	// pass point data to hourly forecast api
	getHourlyForecast(baseUrl);
	// get text forecast
	Menu.getTextForecast(baseUrl);

	// if json is not present then no point lookup was performed
	// use this to determine if a station lookup needs to be carried out
	if (point || !place.station) {
		// get stations
		getStations(baseUrl, place);
	} else {
		// use cached station
		stationsReceived({ features: [{ properties: { stationIdentifier: place.station } }] }, place);
	}

	// get alerts
	Alerts.get(place);
};

const stillRetrying = (e, iteration) => {
	if (iteration === 2) {
		ProgressBar.set('Get forecast failed', true);
		forEachElem('#loading .centering>div', (elem) => elem.classList.add('error'));
	}
};

// get an hourly forecast for a specified url
const getHourlyForecast = async (baseUrl) => {
	// cancel previous request if present
	getHourlyForecast?.cancel?.();
	getHourlyForecastRetry?.cancel?.();
	try {
		const fetchHandler = fetchWithRetry(baseUrl, 0, stillRetrying);
		getHourlyForecast.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Hourly forecast received');
		// test for old data
		if (!forecastIsFresh(data)) {
			getHourlyForecastRetry(baseUrl);
		}
		// store the data
		Forecast.formatData(data, false);
	} catch (error) {
		ProgressBar.message('Get hourly forecast failed', true);
		stillRetrying(0, 2);
	}
};

const forecastIsFresh = (data) => {
	const updateTime = DateTime.fromISO(data.properties.updateTime);
	return Date.now() - updateTime <= Forecast.OLD_FORECAST_LIMIT;
};

// sometimes an out of date forecast is received, retry in the background
const getHourlyForecastRetry = async (url, count = 0) => {
	// clear cancel handle
	getHourlyForecastRetry.cancel = null;

	// message
	ProgressBar.message('Auto retrying for newer forecast');

	if (count > 0) {
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error('Unable to get fresher forecast');
			const data = await response.json();
			// if fresh update the chart
			if (forecastIsFresh(data)) {
				Forecast.formatData(data, false);
				return;
			}
		} catch (error) {
			ProgressBar.message(error.message, true);
		}
	}

	// call again
	const timeoutHandle = setTimeout(() => getHourlyForecastRetry(url, count + 1), backoff(count) * 1000);
	getHourlyForecastRetry.cancel = () => clearTimeout(timeoutHandle);
};

// get list of stations for specified base url
const getStations = async (baseUrl, place) => {
	// cancel previous request if present
	getStations?.cancel?.();
	// look up data
	try {
		const fetchHandler = fetchWithRetry(`${baseUrl}/stations`, 3);
		getStations.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Geocoding complete');
		stationsReceived(data, place);
	} catch (error) {
		ProgressBar.set('Get stations failed!', 2, true);
		ProgressBar.message(error);
		Forecast.formatData(false, 0);	// special "no data present case"
	}
};

// stations received, private
// extract nearest station
const stationsReceived = async (stations, _place) => {
	const place = { ..._place };
	ProgressBar.set(`List of stations received: ${stations.features[0].properties.stationIdentifier}`);
	// see if there is a closest location
	try {
		// if no json was provided then the cached station should be used
		if (stations) {
			place.station = stations.features[0].properties.stationIdentifier;
			saveLocation(place);
		}
		getObservations(place);
	} catch (error) {
		ProgressBar.set('Station identifier not available', 2, true);
		ProgressBar.message(error, true);
		Forecast.formatData(false, 0);// special "no data present case"
	}
};

const getObservations = async (place) => {
	// cancel previous request if present
	getObservations?.cancel?.();
	// calculate 7 days of observations
	const startDate = DateTime.local().minus({ days: 7 }).startOf('day').toISO({ suppressMilliseconds: true });
	// get the observation history for the station
	const url = `${apiUrl}stations/${place.station}/observations?start=${startDate}`;
	try {
		const fetchHandler = fetchWithRetry(url, 3);
		getObservations.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		Forecast.formatData(false, { data, station: place.station });
	} catch (error) {
		// see if the other data arrived
		ProgressBar.set('Get observations failed!', true);
		Forecast.formatData(false, 0);	// special "no data present case"
	}
};

// show error function
const showError = (title, heading, text) => {
	// fill values
	document.querySelector('#dialog-failed-heading').innerHTML = heading;
	document.querySelector('#dialog-failed-text').innerHTML = text;
	document.querySelector('#dialog-failed .dialog .title div').innerHTML = title;

	// show the dialog
	document.querySelector('#dialog-failed').classList.remove('initial-hide');
	setTimeout(() => document.querySelector('#dialog-failed').classList.add('show'), 1);
};

// visibility of page changed
const visibilityChange = () => {
	// test for visibility
	if (document.visibilityState === 'visible') {
		// test for time since last update
		// 15 minutes, or an hour old forecast timestamp
		const now = Date.now();
		const lastUpdate = Forecast.getInfo('lastUpdate');
		const forecastTimestamp = Date.parse(Forecast.getInfo('forecastTimestamp'));
		if (now > lastUpdate + 15 * 60_000
				|| now > forecastTimestamp + 60 * 60_000) {
			// trigger an update
			getPlace();
		}
	}
};
