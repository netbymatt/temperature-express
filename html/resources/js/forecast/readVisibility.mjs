// read the visibility of each series and return an object for use with saving options
const readVisibility = (withPoints, dataset) => {
	const result = {};
	dataset.forEach((series) => {
		// look for new objects
		if (!result?.[series.label]) {
			result[series.label] = series.lines.show || (withPoints && series.points.show);
		}
	});
	return result;
};

export default readVisibility;
