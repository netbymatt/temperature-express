import { getDuration, convertTimestamp } from './utils.mjs';
import { DateTime } from '../vendor/luxon.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
	// set up tooltip
	$('#chart').on('plothover', handler);
	$('#chart').on('plotpan', handler);
	$('#chart').on('plotzoom', handler);
});
const handler = (event, pos, item) => {
	// memoize tooltip
	if (!handler.elem) {
		handler.elem = document.querySelector('#tooltip');
		handler.title = handler.elem.querySelector('#tooltip .title');
		handler.titleContainer = handler.elem.querySelector('#tooltip .title-container');
		handler.value = handler.elem.querySelector('#tooltip .value');
		handler.timestamp = handler.elem.querySelector('#tooltip .timestamp');
		handler.plot = document.querySelector('#chart');
	}
	if (item && event.type === 'plothover') {
		const xDt = DateTime.fromMillis(item.datapoint[0], { zone: 'UTC' });
		const timestamp = xDt.toLocaleString({
			weekday: 'short', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit',
		});

		const { scale } = item.series;

		const value = item.datapoint[1].toFixed(scale.currentPrecision);

		// set the text of the tool tip
		handler.title.innerHTML = item.series.label;
		handler.value.innerHTML = `${value}${scale.currentUnitName}`;
		handler.timestamp.innerHTML = timestamp;

		// figure out the best location, tooltip moves based on what quadrant the mouse is in to keep it from running off the page
		let x = item.pageX;
		let y = item.pageY;
		if (x > handler.plot.clientWidth / 2) {
			x -= 5 + handler.elem.clientWidth;
		} else {
			x += 5;
		}
		if (y > handler.plot.clientHeight / 2) {
			y -= 5 + handler.elem.clientHeight;
		} else {
			y += 5;
		}

		handler.elem.style.top = `${y}px`;
		handler.elem.style.left = `${x}px`;
		handler.titleContainer.style.backgroundColor = item.series.color;

		// show
		handler.elem.classList.remove('initial-hide');
		setTimeout(() => handler.elem.classList.add('show'), 1);
		// fill out the text forecast
		fillTextForecast(item.datapoint[0]);
	} else {
		handler.elem.classList.remove('show');
		// clear out the text forecast
		fillTextForecast();
	}
};

const fillTextForecast = (timestamp) => {
	const elem = document.getElementById('weather-text');

	if (!timestamp || !fillTextForecast.data) return hideTextForecast(elem);

	const matchingPeriod = fillTextForecast.data.find((period) => period.startTime <= timestamp && period.endTime >= timestamp);
	if (!matchingPeriod) return hideTextForecast(elem);

	const strings = matchingPeriod.value.map((f) => `${f.coverage ?? ''} ${f.intensity ?? ''} ${f.weather ?? ''}`.replaceAll('_', ' '));

	const filteredStrings = strings.filter((s) => s.length > 2);
	if (filteredStrings.length < 1) return hideTextForecast(elem);

	elem.innerHTML = `${filteredStrings.join(', ')}`;
	elem.classList.add('show');
	return true;
};

const hideTextForecast = () => {
	document.getElementById('weather-text').classList.remove('show');
};

const generateTextForecastData = (data) => {
	if (!data) {
		fillTextForecast.data = undefined;
		return;
	}

	fillTextForecast.data = data.map((period) => {
		let { startTime, endTime } = getDuration(period.validTime);
		// adjust for time zones to match graph not actually using time zones
		startTime = convertTimestamp(startTime);
		endTime = convertTimestamp(endTime);
		return {
			...period,
			startTime,
			endTime,
		};
	});
};

export {
	handler,
	generateTextForecastData,
	hideTextForecast,
};
