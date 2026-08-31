// find wind direction, private
// finds wind direction in array of timestamp/wind directions pairs
const findWindDirection = (timestamp, windDirections = []) => {
	let direction = 0; // default case
	for (let i = 0; i < windDirections.length; i += 1) {
		// exit loop if we've gone past the provided timestamp
		if (windDirections[i][0] > timestamp) break;
		[, direction] = windDirections[i];
	}
	return direction;
};
export default findWindDirection;
