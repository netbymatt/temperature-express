import { DateTime } from '../../vendor/luxon.mjs';

const formatter = (val, axis) => {
	// calculate axis total time range (hours)
	const axisHours = Math.round(((axis.max - axis.min) / 1000 / 60 / 60) * 10) / 10;
	// determine if this is the first tick
	const firstTick = (val < (axis.min + axis.delta));

	let tick = '';	// return value
	const dt = DateTime.fromMillis(val, { zone: 'UTC' }); // working datetime object
	const lastdt = DateTime.fromMillis(val - tickMs(axis.tickSize) + 1, { zone: 'UTC' }); // last tick (day change detection)

	// less than or equal to 24 hours gets a different display
	if (axisHours <= 24) {
		tick = dt.toLocaleString(DateTime.TIME_SIMPLE);
	} else {
		// more than 24 hours (no minutes)
		tick = dt.toLocaleString(DateTime.TIME_SIMPLE);
		tick = tick.replace(':00', '');
	} // more than 24 hours

	// first tick and date change both get date/day info
	if (dt.day !== lastdt.day
			|| dt.month !== lastdt.month
			|| dt.year !== lastdt.year
			|| firstTick) {
		tick += `<br>${dt.month}/${dt.day}`;
	}

	return tick;
};

// tick size, private
// returns the size of the tick in milliseconds
// tickSize[0] = numeric, [1] = units
const tickMs = (tickSize) => {
	switch (tickSize[1]) {
	case 'year':
		return 1000 * 60 * 60 * 24 * 365 * tickSize[0];
	case 'month':
		return ((1000 * 60 * 60 * 24 * 365) / 12) * tickSize[0];
	case 'day':
		return 1000 * 60 * 60 * 24 * tickSize[0];
	case 'hour':
		return 1000 * 60 * 60 * tickSize[0];
	case 'minute':
		return 1000 * 60 * tickSize[0];
	case 'second':
		return 1000 * tickSize[0];

	default:
		return false;
	}
};

export default formatter;
