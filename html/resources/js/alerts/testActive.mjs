// test for any active alerts
const testActive = (data) => {
	// get current timestamp
	const now = Date.now();
	// loop through the data
	return Object.values(data).reduce((prev, type) => {
		// loop through each value
		// IMPORTANT: this loop cannot be collapsed to return prev || type.reduce as type.reduce sets properties for each individual alert
		const thisActive = type.reduce((acc, alert) => {
			// run test
			// used to include alert.expirems > now
			const alertActive = (alert.replacedBy === undefined && alert.expiresms > now && !alert.supersceded);
			// set a flag if it is active
			if (alertActive) {
				alert.isActive = true;
				type.isActive = true;
			}
			// set a flag if this is an immediate alert
			if (alert.urgency === 'Immediate') {
				alert.isImmediate = true;
				type.isImmediate = true;
			}
			// set a flag if this is a warning
			if (alert?.parameters?.VTEC?.[0]?.match(/\.[A-Z]{2}\.W\.\d{4}/)) {
				alert.isWarning = true;
				type.isWarning = true;
			}

			// return the test result
			return acc || alertActive;
		}, false);

		// update the global response
		return prev || thisActive;
	}, false);
};

export default testActive;
