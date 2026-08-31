import pointInPolygon from './pointInPolygon.mjs';

// handle multi-polygon and holes
const testPolygon = (point, _polygons) => {
	// turn everything into a multi polygon for ease of processing
	let polygons = [[..._polygons.coordinates]];
	if (_polygons.type === 'MultiPolygon') polygons = [..._polygons.coordinates];

	let inArea = false;

	polygons.forEach((_polygon) => {
		// copy the polygon
		const polygon = [..._polygon];
		// if a match has been found don't do anything more
		if (inArea) return;

		// polygons are defined as [[area], [optional hole 1], [optional hole 2], ...]
		const area = polygon.shift();
		// test if inside the initial area
		inArea = pointInPolygon(point, area);

		// if not in the area return false
		if (!inArea) return;

		// test the holes, if in any hole return false
		polygon.forEach((hole) => {
			if (pointInPolygon(point, hole)) {
				inArea = false;
			}
		});
	});
	return inArea;
};

export default testPolygon;
