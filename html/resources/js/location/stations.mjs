import * as ProgressBar from '../progress.mjs';
import { fetchWithRetry } from '../utils.mjs';
import * as Forecast from '../forecast.mjs';
import { saveLocation } from '../placemanager.mjs';
import * as Observations from '../observations/observations.mjs';

// get list of stations for specified base url
const get = async (baseUrl, place) => {
	// cancel previous request if present
	get?.cancel?.();
	// look up data
	try {
		const fetchHandler = fetchWithRetry(`${baseUrl}/stations`, 3);
		get.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Geocoding complete');
		received(data, place);
	} catch (error) {
		ProgressBar.set('Get stations failed!', 2, true);
		ProgressBar.message(error);
		Forecast.formatData(false, 0);	// special "no data present case"
	}
};

// stations received, private
// extract nearest station
const received = async (stations, _place) => {
	const place = { ..._place };
	ProgressBar.set(`List of stations received: ${stations.features[0].properties.stationIdentifier}`);
	// see if there is a closest location
	try {
		// if no json was provided then the cached station should be used
		if (stations) {
			place.station = stations.features[0].properties.stationIdentifier;
			saveLocation(place);
		}
		Observations.get(place);
	} catch (error) {
		ProgressBar.set('Station identifier not available', 2, true);
		ProgressBar.message(error, true);
		Forecast.formatData(false, 0);// special "no data present case"
	}
};

export {
	get,
	received,
};
