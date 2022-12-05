// non-consistent holidays
const THANKSGIVING = ['drumstick-bite', 'Thanksgiving'];
const BEGIN_DAYLIGHT = ['clock', 'Begining of daylight savings time'];
const END_DAYLIGHT = ['clock', 'End of daylight savings time'];
const MEMORIAL = ['monument', 'Memorial Day'];
const LABOR = ['industry', 'Labor Day'];
const ELECTION = ['vote-yea', 'Election Day'];
const EASTER = ['egg', 'Easter'];
const SPRING = ['seedling', 'Vernal Equinox'];
const SUMMER = ['sun', 'Summer Solstice'];
const FALL = ['leaf', 'Autumnal Equinox'];
const WINTER = ['snowflake', 'Winter Solstice'];

const holidaySource = {
	'12/25': ['tree', 'Christmas'],
	'12/24': ['sleigh', 'Christmas Eve'],
	'1/1': ['glass-cheers', 'New Year\'s Day'],
	'2/14': ['heart', 'Valentines Day'],
	'7/4': ['flag-usa', 'Independence Day'],
	'6/14': ['flag-usa', 'Flag Day'],
	'12/11': ['syringe', 'COVID-19 Vaccine first available'],
	'10/31': ['ghost', 'Halloween'],
	'11/11': ['monument', 'Veterans Day'],

	// thanksgiving
	'11/24/2022': THANKSGIVING,
	'11/23/2023': THANKSGIVING,
	'11/28/2024': THANKSGIVING,
	'11/27/2025': THANKSGIVING,
	'11/26/2026': THANKSGIVING,
	'11/25/2027': THANKSGIVING,
	'11/23/2028': THANKSGIVING,
	'11/22/2029': THANKSGIVING,
	'11/28/2030': THANKSGIVING,

	// begin daylight savings
	'3/13/2022': BEGIN_DAYLIGHT,
	'3/12/2023': BEGIN_DAYLIGHT,
	'3/10/2024': BEGIN_DAYLIGHT,
	// end daylight savings
	'11/6/2022': END_DAYLIGHT,
	'11/5/2023': END_DAYLIGHT,
	'11/3/2024': END_DAYLIGHT,

	// memorial day
	'5/30/2022': MEMORIAL,
	'5/29/2023': MEMORIAL,
	'5/27/2024': MEMORIAL,
	'5/26/2025': MEMORIAL,
	'5/25/2026': MEMORIAL,
	'5/31/2027': MEMORIAL,
	'5/29/2028': MEMORIAL,
	'5/28/2029': MEMORIAL,

	// labor day
	'9/5/2022': LABOR,
	'9/4/2023': LABOR,
	'9/2/2024': LABOR,
	'9/1/2025': LABOR,
	'9/7/2026': LABOR,
	'9/6/2027': LABOR,
	'9/4/2028': LABOR,
	'9/3/2029': LABOR,

	// election day
	'11/8/2022': ELECTION,
	'11/7/2023': ELECTION,
	'11/5/2024': ELECTION,
	'11/4/2025': ELECTION,
	'11/9/2026': ELECTION,
	'11/8/2027': ELECTION,
	'11/13/2028': ELECTION,
	'11/12/2029': ELECTION,

	// easter
	'4/17/2022': EASTER,
	'4/9/2023': EASTER,
	'3/31/2024': EASTER,
	'4/20/2025': EASTER,
	'4/5/2026': EASTER,
	'3/28/2027': EASTER,
	'4/16/2028': EASTER,
	'4/1/2029': EASTER,

	// spring
	'3/20/2022': SPRING,
	'3/20/2023': SPRING,
	'3/19/2024': SPRING,
	'3/20/2025': SPRING,
	'3/20/2026': SPRING,

	// summer
	'6/21/2022': SUMMER,
	'6/21/2023': SUMMER,
	'6/20/2024': SUMMER,
	'6/20/2025': SUMMER,
	'6/21/2026': SUMMER,

	// fall
	'9/22/2022': FALL,
	'9/23/2023': FALL,
	'9/22/2024': FALL,
	'9/22/2025': FALL,
	'9/22/2026': FALL,

	// winter
	'12/21/2022': WINTER,
	'12/21/2023': WINTER,
	'12/21/2024': WINTER,
	'12/21/2025': WINTER,
	'12/21/2026': WINTER,

};

// expand absolute dates by adding year, otherwise return date as is
const dates = {};
const thisYear = (new Date()).getFullYear();
Object.entries(holidaySource).forEach(([date, icon]) => {
	if ((date.match(/\//g) ?? []).length >= 2) {
		dates[date] = icon;
	} else {
		// add for three years
		dates[`${date}/${thisYear - 1}`] = icon;
		dates[`${date}/${thisYear}`] = icon;
		dates[`${date}/${thisYear + 1}`] = icon;
	}
});

const lookup = (day) => dates[day.toFormat('L/d/yyyy')];
export default lookup;
