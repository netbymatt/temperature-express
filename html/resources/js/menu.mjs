import { getOptions } from './options.mjs';
import * as ProgressBar from './progress.mjs';
import { getSavedPlaces, getSavedLocation } from './placemanager.mjs';

document.addEventListener('DOMContentLoaded', () => init());

let deferredPrompt;
// listen for an install prompt
window.addEventListener('beforeinstallprompt', (e) => {
	// store the event
	deferredPrompt = e;
});

// initialize the menu
const init = () => {
	// open menu button
	document.getElementById('menu-touch').addEventListener('click', show);
	// close menu button
	document.querySelector('.side-menu.dialog .close').addEventListener('click', hide);
	// other menu items
	document.getElementById('menu-add').addEventListener('click', addToHomeScreen);
	document.getElementById('menu-footer').addEventListener('click', () => { hide(); ProgressBar.showMessages(); });
	document.querySelector('.menu-forecast-expand').addEventListener('click', swapTextForecast);

	registerCloseAll(ProgressBar.hideMessages);

	// set the initial units
	if (getOptions().units === 0) {
		// in metric
		document.querySelector('#menu-units span').innerHTML = 'Metric';
	} else {
		// in US
		document.querySelector('#menu-units span').innerHTML = 'US';
	}
	unitsChanged();
};

// show the menu
const show = () => {
	// hide other dialogs
	closeAll();

	const elem = document.querySelector('.side-menu');
	elem.classList.add('show');

	// fill in location information
	document.querySelector('.menu-location-text').innerHTML = getSavedLocation().name;

	// fill in location history
	fillLocationHistory();

	// turn on "add to home screen" if we've met the requirements
	if (deferredPrompt) {
		document.getElementById('menu-add').classList.remove('hidden-placeholders');
	}
};
const hide = () => {
	document.querySelector('.side-menu').classList.remove('show');
};

const unitsChanged = () => {
	// get current units
	const { units } = getOptions();
	if (units === 1) {
		// in metric, switch to us
		document.querySelector('#menu-units span').innerHTML = 'US';
	} else {
		// in US, switch to metric
		document.querySelector('#menu-units span').innerHTML = 'Metric';
	}
	// get the text forecast (it switches units internally)
	getTextForecast();
};

// get a text forecast
const getTextForecast = async (_baseUrl, isRetry) => {
	let baseUrl = _baseUrl;
	// store the base url if one was provided
	if (typeof baseUrl === 'string') {
		getTextForecast.baseUrl = baseUrl;
	} else {
		// attempt to load the base url if one was not provided
		baseUrl = getTextForecast.baseUrl;
	}
	// check for a base url
	if (typeof baseUrl !== 'string') return;

	const units = (getOptions().units === 1) ? 'us' : 'si';
	try {
		const response = await fetch(`${baseUrl}/forecast?units=${units}`);
		if (response.status !== 200) throw new Error(`Response status code: ${response.status}`);
		const json = await response.json();
		forecastReceived(json);
	} catch (e) {
		if (!isRetry) {
			ProgressBar.message('Retrying get text forecast one time');
			setTimeout(() => getTextForecast(_baseUrl, true), 1000);
		} else {
			ProgressBar.set('Get text forecast failed', true);
			ProgressBar.message(e, true);
			document.querySelector('.side-menu .row.forecast').style.removeProperty('display');
		}
	}
};

// forecast received
// fill out forecast area in menu and show it
const forecastReceived = (forecastData) => {
	// update progress bar
	ProgressBar.set('Text forecast received');
	// grab the data we're interested in
	const data = forecastData.properties.periods[0];
	// fill in the forecast
	document.getElementById('menu-forecast-header').innerHTML = data.name;
	// change the icon size from medium
	document.querySelector('.side-menu .row.forecast img').src = data.icon.replace(/size=.*$/, 'size=50');
	// determine if high or low temperature was provided
	if (data.isDaytime) {
		document.getElementById('menu-forecast-high').style.removeProperty('display');
		document.querySelector('#menu-forecast-high span').innerHTML = `${data.temperature} ${data.temperatureUnit}`;
		document.getElementById('menu-forecast-low').style.display = 'none';
	} else {
		document.getElementById('menu-forecast-low').style.removeProperty('display');
		document.querySelector('#menu-forecast-low span').innerHTML = `${data.temperature} ${data.temperatureUnit}`;
		document.getElementById('menu-forecast-high').style.display = 'none';
	}
	document.getElementById('menu-forecast-wind-direction').innerHTML = data.windDirection;
	document.getElementById('menu-forecast-wind-speed').innerHTML = data.windSpeed;
	document.getElementById('menu-forecast-text').innerHTML = data.shortForecast;
	document.getElementById('menu-forecast-text-expanded').innerHTML = data.detailedForecast;

	// show the forecast
	document.querySelector('.side-menu .row.forecast').style.display = 'block';
};

// prompt user to add to home screen
const addToHomeScreen = async () => {
	// send the prompt
	await deferredPrompt.prompt();

	// hide option on menu
	document.getElementById('menu-add').classList.add('hidden-placeholders');
	// clear the prompt, we can't use it again
	deferredPrompt = undefined;
};

// fill the list of location histories
const fillLocationHistory = () => {
	// get the list
	const places = getSavedPlaces();

	// generate the elements
	const container = document.getElementById('menu-prev-locations');
	container.innerHTML = '';

	const elements = places.map((place, index) => {
		const element = document.createElement('div');
		element.textContent = place.name;
		element.dataset.index = index;
		return element;
	});

	container.append(...elements);

	// set "use gps" visibility
	const followMeElem = document.getElementById('menu-location');
	const { followMe } = getSavedLocation();
	if (followMe) {
		followMeElem.classList.add('gps');
	} else {
		followMeElem.classList.remove('gps');
	}
};

const clickItemHandler = (handler) => (e) => {
	// close all others
	closeAll();
	handler(e);
};

const registerClickHandler = (selector, handler) => {
	document.getElementById(selector).addEventListener('click', clickItemHandler(handler));
};

const itemsToClose = [];

const closeAll = () => {
	hide();
	// run each close handler
	itemsToClose.forEach((item) => item());
};

const registerCloseAll = (handler) => {
	itemsToClose.push(handler);
};

const swapTextForecast = () => {
	// toggle expanded state
	const container = document.getElementById('menu-forecast-text-area');
	container.classList.toggle('expanded');
};

export {
	registerClickHandler,
	registerCloseAll,
	closeAll,
	unitsChanged,
	getTextForecast,
};
