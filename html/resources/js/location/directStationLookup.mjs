import * as ProgressBar from '../progress.mjs';
import { apiUrl } from '../utils.mjs';

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
		return [
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

export default directStationLookup;
