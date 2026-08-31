// scan forwards and backwards through the array and replace a null that is adjacent
// modify data in place
const zeroAdjacentNulls = (data) => {
	const newData = [];
	const lastIndex = data.length - 1;
	for (let i = 0; i <= lastIndex; i += 1) {
		// copy only if not already touched
		if (!newData[i]) newData[i] = [data[i][0], data[i][1]];

		// forwards
		const next = data?.[i + 1]?.[1];
		if (data[i][1] === null && next !== null && next !== undefined) newData[i][1] = 0;

		// backwards
		const prev = data?.[lastIndex - i - 1]?.[1];
		if (data[lastIndex - i][1] === null && prev !== null && prev !== undefined) newData[lastIndex - i] = [data[lastIndex - i][0], 0];
	}
	return newData;
};

export default zeroAdjacentNulls;
