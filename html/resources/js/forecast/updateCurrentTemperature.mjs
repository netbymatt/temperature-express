const updateCurrentTemperature = (dataset) => {
	const temperatureData = dataset.find((d) => d.label === 'Temperature' && d.isObs);
	if (temperatureData) {
		const latestTemperature = temperatureData.data?.at?.(-1)?.[1];
		const { scale } = temperatureData;
		if (latestTemperature) {
			document.querySelector('#current-temperature').innerHTML = latestTemperature.toFixed(scale.currentPrecision) + scale.currentUnitName;
		}
	}
};

export default updateCurrentTemperature;
