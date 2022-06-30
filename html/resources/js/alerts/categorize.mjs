// categorize as follows {immediate and active, active, immediate and inactive, inactive}
const byImmediate = (data) => {
	// result structure
	const result = {
		immediate: {},
		active: {},
		immediateInactive: {},
		inactive: {},
	};
	Object.entries(data).forEach(([type, alert]) => {
		// sort each category
		if (alert.isActive && alert.isImmediate) {
			result.immediate[type] = alert;
		} else if (alert.isActive) {
			result.active[type] = alert;
		} else if (alert.isImmediate) {
			result.immediateInactive[type] = alert;
		} else {
			result.inactive[type] = alert;
		}
	});

	return result;
};

// categorize the data by .properties.event
// also do a bit of formatting such as moving the properties up to the main level
const byEvent = (json) => {
	// scan for any updated values
	const updated = json.features.map((feature) => {
		if (feature.properties.messageType === 'Update' || feature.properties.messageType === 'Cancel') {
			return feature.properties.references.map((ref) => ref.identifier);
		}
		return false;
	}).filter((d) => d).flat();

	// return value
	const result = {};
	// loop through all features
	json.features.forEach((_alert) => {
		const alert = { ..._alert };
		// test for existing event
		if (!result?.[alert.properties.event]) {
			// add the event type as an array
			result[alert.properties.event] = [];
		}
		// sorting is done on the effective field, turn the timestamp provided into a numerical timestamp for quick sorting
		alert.properties.effectivems = Date.parse(alert.properties.effective);
		// expires is more complicated, per nws expires = product expired, an updated product should have been issued by this time
		// ends = the alerted/warned conditions are no longer expected to occur
		// thus ends should be used, and if it is not available, fallback to expires
		const end = alert.properties.ends ?? alert.properties.expires;
		alert.properties.expiresms = Date.parse(end);
		// determine if this was updated by another message
		alert.properties.supersceded = updated.includes(alert.properties.id);
		// store the data
		result[alert.properties.event].push(alert.properties);
	});	// each alert
	// return the result
	return result;
};

export {
	byImmediate,
	byEvent,
};
