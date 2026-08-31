import { DateTime } from '../../vendor/luxon.mjs';
import { convertTimestamp } from '../utils.mjs';

// calculate plotting limits
const plotLimits = (metaData) => {
	// if no metadata exists plot 7 days each way
	if (!metaData.minTimestamp || !metaData.maxTimestamp || !metaData.oldestData) {
		return {
			beginningOfFirst: convertTimestamp(DateTime.now().startOf('day')),
			endOfLast: convertTimestamp(DateTime.now().plus({ days: 7 }).endOf('day')),
			oldestData: convertTimestamp(DateTime.now().plus({ days: -7 }).startOf('day')),
		};
	}
	// calculate beginning of first day and end of last day to snap display to full days
	return {
		beginningOfFirst: convertTimestamp(metaData.minTimestamp.startOf('day')),
		endOfLast: convertTimestamp(metaData.maxTimestamp.endOf('day')),
		oldestData: convertTimestamp(metaData.oldestData.startOf('day')),
	};
};

export default plotLimits;
