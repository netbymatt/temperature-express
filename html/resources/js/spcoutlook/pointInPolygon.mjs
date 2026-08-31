const pointInPolygon = (point, polygon) => {
	// ray casting method from https://github.com/substack/point-in-polygon
	const x = point[0];
	const y = point[1];
	let inside = false;
	// eslint-disable-next-line no-plusplus
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i][0];
		const yi = polygon[i][1];
		const xj = polygon[j][0];
		const yj = polygon[j][1];
		const intersect = ((yi > y) !== (yj > y))
			&& (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
};

export default pointInPolygon;
