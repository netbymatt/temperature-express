// local variables
const DEFAULT_PLACE = {
	textSearch: null, // users text search if provided
	lat: null,	// lat-lon from geocode or gps
	lon: null,
	pointX: null,	// point x,y from lat-lon lookup
	pointY: null,
	office: null,	// office from lat-lon lookup
	name: null,	// nicely formatted City, State from lat-lon lookup
	followMe: null, // follow me from GPS
	pointInfo: null,	// point info from NWS
	timeZone: 'UTC',
	station: null,
};

// returns saved location from and gets updated weather data
const getSavedLocation = () => {
	if (!localStorage.getItem) return { ...DEFAULT_PLACE };
	// check for object in browser data store
	const saveStr = localStorage.getItem('location');
	if (saveStr !== null) return { ...DEFAULT_PLACE, ...JSON.parse(saveStr) };
	return { ...DEFAULT_PLACE };
};

// save provided location structure
const saveLocation = (saveObj) => {
	if (!localStorage.setItem) return;
	localStorage.setItem('location', JSON.stringify(saveObj));
	// save it to the history list
	savePlace(saveObj);
};

// save a previous place to the previous place list
const savePlace = (newPlace) => {
	// get current list of previous places
	const saved = getSavedPlaces();

	// see if there is a match between the new place and any existing place
	const match = saved.findIndex((val) => (
		val.pointX === newPlace.pointX
				&& val.pointY === newPlace.pointY
				&& val.office === newPlace.office
	));

	// if there's a match remove the existing item
	if (match !== -1) {
		saved.splice(match, 1);
	}
	// put it at the beginning of the list
	saved.unshift(newPlace);

	// save the updated array
	// limit the length of the list to 5
	localStorage.setItem('savedLocations', JSON.stringify(saved.splice(0, 5)));
};

// get list of saved places
// newest saved place is at index 0
const getSavedPlaces = () => {
	if (!localStorage.getItem) return [];

	// check for object in browser data store
	const saveStr = localStorage.getItem('savedLocations');
	if (!saveStr) return [];
	return JSON.parse(saveStr);
};

export {
	getSavedLocation,
	saveLocation,
	getSavedPlaces,
	DEFAULT_PLACE,
};
