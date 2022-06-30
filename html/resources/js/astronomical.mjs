import { DateTime, Duration } from '../vendor/luxon.min.mjs';
import { getSavedLocation } from './placemanager.mjs';
import * as Menu from './menu.mjs';

/* globals SunCalc */
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

	if (sunTimes.sunrise) document.getElementById('sunrise').innerHTML = DateTime.fromJSDate(sunTimes.sunrise).setZone(timeZone).toFormat('tt').toLowerCase();
	if (sunTimes.sunset) document.getElementById('sunset').innerHTML = DateTime.fromJSDate(sunTimes.sunset).setZone(timeZone).toFormat('tt').toLowerCase();
	if (sunTimes.sunrise && sunTimes.sunset) {
		document.getElementById('sunduration').innerHTML = Duration.fromMillis(DateTime.fromJSDate(sunTimes.sunset) - DateTime.fromJSDate(sunTimes.sunrise)).toFormat('h:mm:ss');
	}

	if (moonTimes.rise) document.getElementById('moonrise').innerHTML = DateTime.fromJSDate(moonTimes.rise).setZone(timeZone).toFormat('tt').toLowerCase();
	if (moonTimes.set) document.getElementById('moonset').innerHTML = DateTime.fromJSDate(moonTimes.set).setZone(timeZone).toFormat('tt').toLowerCase();
	if (moonTimes.set && moonTimes.rise) {
		document.getElementById('moonduration').innerHTML = Duration.fromMillis(DateTime.fromJSDate(moonTimes.set) - DateTime.fromJSDate(moonTimes.rise)).toFormat('h:mm:ss');
	}

	document.getElementById('moonphase').innerHTML = (moonPhase.phase > 0.5 ? '-' : '+') + moonPhase.fraction.toFixed(2);
};

const show = () => {
	// calc info and fill dialog
	sunInfo();
	// open the dialog
	document.querySelector('#dialog-sun').classList.remove('initial-hide');
	setTimeout(() => document.querySelector('#dialog-sun').classList.add('show'), 1);
};

const hide = () => {
	document.querySelector('#dialog-sun').classList.remove('show');
};
