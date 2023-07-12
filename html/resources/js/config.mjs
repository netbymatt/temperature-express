import { getOptions } from './options.mjs';
import ScaledNumber from '../vendor/scalednumber.mjs';

// returns an object representing how to plot each trend
const trendConfig = (displayName, scale, units, yAxis, lineType, valueFunction) => {
	const obj = {
		displayName,
		scale,
		units,
		yAxis,	// 0=temperature, 1=percent, 2=inches (precipitation)
		lineType, 	// 0=no fill, 1=fill to zero, 2=points only
		valueFunction,
	};
		// set default display units
	obj.scale.setUnit(units);
	return obj;
};

// returns line type based on plot type
const getLineType = (lineType, name, forceState = false) => {
	// get value from options, default to true if not yet present it options
	const visible = getOptions().visible[name];
	const opt = (visible === undefined) ? true : visible ?? forceState;

	switch (lineType) {
	case 2:
		// points only
		return {
			show: false,
		};
	case 1:
		// filled under line to zero
		return {
			fill: opt,
			lineWidth: 0,
			show: opt,
		};
	case 0:
	default:
		// line only, no fill
		return {
			show: opt,
			lineWidth: 2,
		};
	}
};

// get point type
const getPointType = (pointType, name, forceState = false) => {
	// get value from options, default to true if not yet present it options
	const visible = getOptions().visible[name];
	const opt = (visible === undefined) ? true : visible ?? forceState;
	if (pointType === 2) {
		return {
			show: opt,
			fillColor: '#00000000',
		};
	}

	return {
		show: false,
	};
};

const LEGEND_COLORS = {
	Temperature: 'rgb(203, 75, 75)',
	Dewpoint: 'rgb(123, 210, 98)',
	Precip: 'rgb(131, 194, 239)',
	Clouds: 'rgb(210, 210, 210)',
	'Cloud Coverage': 'rgb(128, 128, 128)',
	'Feels Like': 'rgb(210, 98, 161)',
	'Wind Speed': 'rgb(237, 194, 64)',
	'Wind Gust': 'rgb(235, 150, 0)',
	Snow: 'rgb(58,58,239)',
	Ice: 'rgb(0,255,0)',
	Barometer: 'rgb(192,192,192)',
	'Lightning (1-5)': 'rgb(128,128,0)',
	Rain: 'rgb(232, 198, 67)',
};

// return a set color for each legend
const colorByLegend = (legend, observation) => {
	// if observation change the opacity to 50% for faded look
	if (observation) {
		if (legend !== 'Cloud Coverage' && legend !== 'Rain') return LEGEND_COLORS[legend].replace(')', ', 0.5)');
		return LEGEND_COLORS[legend];
	}
	return LEGEND_COLORS[legend];
};

const SCALES = {	// unit[0] = the units provided by the nws api (metric), [1] = US
	TEMPERATURE: [{ unit: '&deg;C' }, { unit: '&deg;F', m: 1 / 1.8, b: -32 / 1.8 }],
	WIND: [{ unit: 'km/h' }, { unit: 'mph', m: 1.61, b: 0 }],
	PERCENT: [{ unit: '%' }, { unit: '%', m: 1, b: 0 }],
	INCHES: [{ unit: 'mm' }, {
		unit: 'in', m: 25.4, b: 0, precision: 1,
	}],
	INCHES_ICE: [{ unit: 'mm' }, {
		unit: 'in', m: 25.4, b: 0, precision: 2,
	}],
	INCHES_RAIN: [{ unit: 'mm' }, {
		unit: 'in', m: 25.4, b: 0, precision: 2,
	}],
	BAROMETER: [
		{ unit: 'Pa' },
		{
			unit: '"', m: 1 / 0.000_295_3, b: 0, precision: 2,
		}],
	LIGHTNING: [
		{ unit: '', m: 1, b: -1 },
		{ unit: '' },
		// {
		// 	unit: '', m: 1, b: 1, precision: 0,
		// },
	],
};

const AXIS = {
	PERCENT: 2,
	SNOW_IN: 3,
	ICE_IN: 4,
	BAROMETER_IN: 5,
	TEMPERATURE: 1,
	LIGHTNING: 6,
	RAIN_IN: 7,
};

const FILL = {
	NO: 0,
	ZERO: 1,
	POINTS: 2,
};

// null zero values on forecast
const NULL_VALUES = (toNull = 0) => (value) => (value === toNull ? null : value);

const DAY_BG_COLORS = {
	FREEZING: {
		LIGHT: '#EEFFFF',
		DARK: '#0080FF30',
	},
	DAY: {
		LIGHT: '#F4F4F4F4',
		DARK: '#FFFFFF30',
	},
};

const AVAILABLE_TRENDS = { // trends that will be extracted from resulting data (forecast data)
	// display name, scaled number, display units, y axis, fill type, extra function
	skyCover: trendConfig('Clouds', new ScaledNumber(0, 0, 100, SCALES.PERCENT), '%', AXIS.PERCENT, FILL.ZERO),
	probabilityOfPrecipitation: trendConfig('Precip', new ScaledNumber(0, 0, 100, SCALES.PERCENT), '%', AXIS.PERCENT, FILL.ZERO, NULL_VALUES(0)),
	quantitativePrecipitation: trendConfig('Rain', new ScaledNumber(0, 0, 1000, SCALES.INCHES_RAIN), 'in', AXIS.RAIN_IN, FILL.ZERO, NULL_VALUES(0)),
	snowfallAmount: trendConfig('Snow', new ScaledNumber(0, 0, 1000, SCALES.INCHES), 'in', AXIS.SNOW_IN, FILL.ZERO, NULL_VALUES(0)),
	iceAccumulation: trendConfig('Ice', new ScaledNumber(0, 0, 1000, SCALES.INCHES_ICE), 'in', AXIS.ICE_IN, FILL.ZERO, NULL_VALUES(0)),
	temperature: trendConfig('Temperature', new ScaledNumber(0, -1000, 1000, SCALES.TEMPERATURE), '&deg;F', AXIS.TEMPERATURE, FILL.NO),
	dewpoint: trendConfig('Dewpoint', new ScaledNumber(0, -1000, 1000, SCALES.TEMPERATURE), '&deg;F', AXIS.TEMPERATURE, FILL.NO),
	apparentTemperature: trendConfig('Feels Like', new ScaledNumber(0, -1000, 1000, SCALES.TEMPERATURE), '&deg;F', AXIS.TEMPERATURE, FILL.NO),
	windSpeed: trendConfig('Wind Speed', new ScaledNumber(0, -1000, 1000, SCALES.WIND), 'mph', AXIS.PERCENT, FILL.NO),
	pressure: trendConfig('Barometer', new ScaledNumber(0, 0, 1e7, SCALES.BAROMETER), '"', AXIS.BAROMETER_IN, FILL.NO),
	lightningActivityLevel: trendConfig('Lightning (1-5)', new ScaledNumber(0, 0, 5, SCALES.LIGHTNING), '', AXIS.LIGHTNING, FILL.ZERO, NULL_VALUES(0)),
};

const AVAILABLE_OBS = { // observations that will be extracted from resulting data (past observations)
	// display name, scaled number, display units, y axis, fill type
	cloudLayers: trendConfig('Cloud Coverage', new ScaledNumber(0, 0, 100, SCALES.PERCENT), '%', AXIS.PERCENT, FILL.ZERO),
	temperature: trendConfig('Temperature', new ScaledNumber(0, -1000, 1000, SCALES.TEMPERATURE), '&deg;F', AXIS.TEMPERATURE, FILL.NO),
	dewpoint: trendConfig('Dewpoint', new ScaledNumber(0, -1000, 1000, SCALES.TEMPERATURE), '&deg;F', AXIS.TEMPERATURE, FILL.NO),
	windSpeed: trendConfig('Wind Speed', new ScaledNumber(0, -1000, 1000, SCALES.WIND), 'mph', AXIS.PERCENT, FILL.NO),
	windGust: trendConfig('Wind Gust', new ScaledNumber(0, -1000, 1000, SCALES.WIND), 'mph', AXIS.PERCENT, FILL.POINTS, NULL_VALUES(0)),
	barometricPressure: trendConfig('Barometer', new ScaledNumber(0, 0, 1e7, SCALES.BAROMETER), '"', AXIS.BAROMETER_IN, FILL.NO),
	precipitationLastHour: trendConfig('Rain', new ScaledNumber(0, 0, 1000, SCALES.INCHES_RAIN), 'in', AXIS.RAIN_IN, FILL.ZERO),
	// special case in formatting routine to extract heat index or wind chill
	apparentTemperature: trendConfig('Feels Like', new ScaledNumber(0, -1000, 1000, SCALES.TEMPERATURE), '&deg;F', AXIS.TEMPERATURE, FILL.NO),
};

const AXIS_LIMITS = {
	y3: {
		// snow in inches
		min: 0,
		max: 8,
	},
	y4: {
		// ice in inches
		min: 0,
		max: 0.5,
	},
	y5: {
		// barmoeter in inches
		// max is intentionally high to keep the barometer towards the bottom of the graph
		min: 29,
		max: 34,
	},
	y7: {
		// rain in inches
		min: 0,
		max: 2.5,
	},
};

export {
	getLineType,
	getPointType,
	colorByLegend,
	SCALES,
	AVAILABLE_TRENDS,
	AVAILABLE_OBS,
	DAY_BG_COLORS,
	AXIS_LIMITS,
};
