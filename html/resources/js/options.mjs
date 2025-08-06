const DEFAULT_OPTIONS = {
	visible: {},
	units: 1,	// US
	highFrequency: false,
};

// return options, or the defaults
const getOptions = () => {
	// default object
	let saveObj = { ...DEFAULT_OPTIONS };

	if (localStorage.getItem) {
		// check for object in browser data store
		const saveStr = localStorage.getItem('options');
		if (saveStr !== null) {
			// combine with defaults to add any new features
			saveObj = { ...DEFAULT_OPTIONS, ...JSON.parse(saveStr) };
		}
		return saveObj;
	}
	return {};
};

// save options
// can be called with the entire object or a single key, value pair
const saveOptions = (key, value) => {
	if (localStorage.setItem) {
		// save entire object
		if (typeof key === 'object') {
			localStorage.setItem('options', JSON.stringify(key));
		} else {
			// save a single key
			// create object to combine with existing settings
			const newKeyVal = {};
			newKeyVal[key] = value;
			// get existing settings and combine
			const saveObj = { ...getOptions(), ...newKeyVal };
			// save the object
			localStorage.setItem('options', JSON.stringify(saveObj));
		}
	}
};

export { getOptions, saveOptions };
