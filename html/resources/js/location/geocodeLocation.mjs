import { fetchWithRetry, forEachElem } from '../utils.mjs';
import * as ProgressBar from '../progress.mjs';

const stillRetrying = (e, iteration) => {
	if (iteration === 2) {
		ProgressBar.set('Location lookup failed', true);
		forEachElem('#loading .centering>div', (elem) => elem.classList.add('error'));
	}
};

const geoCodeLocation = async (url, place, latLonReceivedCallback) => {
	// cancel previous request if present
	geoCodeLocation?.cancel?.();
	// look up data
	try {
		const fetchHandler = fetchWithRetry(url, 2, stillRetrying);
		geoCodeLocation.cancel = fetchHandler.cancel;
		const data = await fetchHandler.data;
		ProgressBar.set('Geocoding complete');
		latLonReceivedCallback(data, place);
	} catch (error) {
		ProgressBar.set('Unable to geocode', true);
		ProgressBar.message(error, true);
		stillRetrying(0, 2);
	}
};

export default geoCodeLocation;
