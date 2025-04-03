import { DateTime, Duration } from '../vendor/luxon.mjs';
import { getSavedLocation } from './placemanager.mjs';
import * as Menu from './menu.mjs';

const DIALOG_SUN = '#dialog-sun';

// initialize
document.addEventListener('DOMContentLoaded', () => {
	document.querySelector('#dialog-sun.dialog .close').addEventListener('click', hide);
	Menu.registerClickHandler('menu-sun', show);
	Menu.registerCloseAll(hide);
});

// fill out the dialog data
const sunInfo = () => {
	// set time zone
	const savedLocation = getSavedLocation();
	let { timeZone } = savedLocation;
	const { lat, lon } = savedLocation;

	timeZone ??= 'UTC';

	// fill values
	const now = new Date();
	const sunTimes = SunCalc.getTimes(now, lat, lon);
	const moonTimes = SunCalc.getMoonTimes(now, lat, lon);
	const moonPhase = SunCalc.getMoonIllumination(now);

	if (sunTimes.sunrise) document.querySelector('#sunrise').innerHTML = DateTime.fromJSDate(sunTimes.sunrise).setZone(timeZone).toFormat('tt').toLowerCase();
	if (sunTimes.sunset) document.querySelector('#sunset').innerHTML = DateTime.fromJSDate(sunTimes.sunset).setZone(timeZone).toFormat('tt').toLowerCase();
	if (sunTimes.sunrise && sunTimes.sunset) {
		document.querySelector('#sunduration').innerHTML = Duration.fromMillis(DateTime.fromJSDate(sunTimes.sunset) - DateTime.fromJSDate(sunTimes.sunrise)).toFormat('h:mm:ss');
	}

	if (moonTimes.rise) document.querySelector('#moonrise').innerHTML = DateTime.fromJSDate(moonTimes.rise).setZone(timeZone).toFormat('tt').toLowerCase();
	if (moonTimes.set) document.querySelector('#moonset').innerHTML = DateTime.fromJSDate(moonTimes.set).setZone(timeZone).toFormat('tt').toLowerCase();
	if (moonTimes.set && moonTimes.rise) {
		document.querySelector('#moonduration').innerHTML = Duration.fromMillis(DateTime.fromJSDate(moonTimes.set) - DateTime.fromJSDate(moonTimes.rise)).toFormat('h:mm:ss');
	}

	document.querySelector('#moonphase').innerHTML = (moonPhase.phase > 0.5 ? '-' : '+') + moonPhase.fraction.toFixed(2);
};

const show = () => {
	// calc info and fill dialog
	sunInfo();
	// open the dialog
	document.querySelector(DIALOG_SUN).classList.remove('initial-hide');
	setTimeout(() => document.querySelector(DIALOG_SUN).classList.add('show'), 1);
};

const hide = () => {
	document.querySelector(DIALOG_SUN).classList.remove('show');
};
