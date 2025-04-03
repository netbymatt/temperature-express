// hierarchical place name extraction
const formatPlaceName = (address) => {
	// no address is provided if lat/lon are used for coordinates
	if (!address) return null;
	const city = address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.hamlet ?? address.county ?? '';
	const { state } = address;
	if (!state) return city;
	return `${city}, ${state}`;
};

export {
	formatPlaceName,
};
