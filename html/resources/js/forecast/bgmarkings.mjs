import { DateTime } from '../../vendor/luxon.min.mjs';
import { AVAILABLE_TRENDS, DAY_BG_COLORS } from '../config.mjs';
import { dark, convertTimestamp } from '../utils.mjs';
import { getSavedLocation } from '../placemanager.mjs';

/* globals SunCalc */

const generator = (metaData) => {
	const generateMarks = (axes) => {
		const isDark = dark();
		// days since epoch
		const startDays = Math.floor(axes.xaxis.min / (1000 * 60 * 60 * 24));

		// calculate size of background boxes based on visible area
		// light = daylight

		// array of highlights
		const markings = [];

		markings.push(...dayNight(startDays, axes, isDark));

		// calculate 5 px width for black line (as ms)
		// since the plot is not yet drawn, we have to make a best guess about the width of the plot area based on the width of the chart placeholder
		const lineWidth = axes.xaxis.c2p(2) - axes.xaxis.c2p(0);

		markings.push(...dayBoundaries(startDays, axes, lineWidth));

		// blue line at current time
		const currentMillis = convertTimestamp(DateTime.local().setZone(metaData.minTimestamp.zone.name));
		markings.push({ xaxis: { from: currentMillis - lineWidth / 3, to: currentMillis + lineWidth / 3 }, color: '#0000FF' });

		return markings;
	};

	// day and night background colors based on sunrise/sunset
	const dayNight = (startDays, axes, isDark) => {
		const markings = [];
		// calculate midnight on start day
		let i = startDays * 24 * 60 * 60 * 1000 + metaData.minTimestamp.o * 1000;

		// grab latitude and longitude for sun calculations
		const { lat, lon } = getSavedLocation();

		// pre-populate sunrise and sunset times
		let yesterdayTimes = SunCalc.getTimes(DateTime.fromMillis(i).minus({ days: 1 }).toJSDate(), lat, lon);

		const freezingColor = (isDark) ? DAY_BG_COLORS.FREEZING.DARK : DAY_BG_COLORS.FREEZING.LIGHT;
		const dayColor = (isDark) ? DAY_BG_COLORS.DAY.DARK : DAY_BG_COLORS.DAY.LIGHT;

		do {
		// calculate today's
			const todayTimes = SunCalc.getTimes(DateTime.fromMillis(i).toJSDate(), lat, lon);

			let from;
			let to;
			if (!isDark) {
				from = convertTimestamp(DateTime.fromJSDate(yesterdayTimes.sunset, { zone: metaData.minTimestamp.zone.name }));
				to = convertTimestamp(DateTime.fromJSDate(todayTimes.sunrise, { zone: metaData.minTimestamp.zone.name }));
			} else {
			// dark mode slightly lightens the background from dawn to dusk
				from = convertTimestamp(DateTime.fromJSDate(todayTimes.sunrise, { zone: metaData.minTimestamp.zone.name }));
				to = convertTimestamp(DateTime.fromJSDate(todayTimes.sunset, { zone: metaData.minTimestamp.zone.name }));
			}
			// gray on top
			markings.push({
				xaxis: {
					from,
					to,
				},
				yaxis: {
					from: AVAILABLE_TRENDS.apparentTemperature.scale.set(0, 0),
				},
				color: dayColor,
			});
			// blue (freezing) on bottom
			markings.push({
				xaxis: {
					from,
					to,
				},
				yaxis: { to: AVAILABLE_TRENDS.apparentTemperature.scale.set(0, 0) },
				color: freezingColor,
			});
			i += 24 * 60 * 60 * 1000;
			// shift sunrise/set data
			yesterdayTimes = todayTimes;
		} while (i < axes.xaxis.max + 26 * 60 * 60 * 1000);
		return markings;
	};

	// dark vertical line at day boundaries
	const dayBoundaries = (startDays, axes, lineWidth) => {
		const markings = [];
		// reset to midnight on first day
		let i = startDays * 24 * 60 * 60 * 1000;
		do {
		// vertical black line
			markings.push({ xaxis: { from: i - lineWidth / 2, to: i + lineWidth / 2 }, color: '#000000' });
			i += 2 * 12 * 60 * 60 * 1000;
		} while (i < axes.xaxis.max);
		return markings;
	};

	return generateMarks;
};

export default generator;
