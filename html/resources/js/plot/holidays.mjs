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
	'10/21': ['school', 'Back to the Future Day'],
	'7/20': ['user-astronaut', 'Moon Landing Anniversary'],
	'3/10': ['star', 'Mario Day'],
	'3/14': ['pie', 'Pi Day'],
	'4/5': ['hand-spock', 'First Contact Day'],
	'4/7': ['network-wired', 'Internet\'s Birthday'],
	'5/4': ['jedi-order', 'Star Wars Day'],

	// thanksgiving
	'11/28/2024': THANKSGIVING,
	'11/27/2025': THANKSGIVING,
	'11/26/2026': THANKSGIVING,
	'11/25/2027': THANKSGIVING,
	'11/23/2028': THANKSGIVING,
	'11/22/2029': THANKSGIVING,
	'11/28/2030': THANKSGIVING,

	// begin daylight savings
	'3/9/2025': BEGIN_DAYLIGHT,
	'3/8/2026': BEGIN_DAYLIGHT,
	'3/14/2027': BEGIN_DAYLIGHT,
	'3/12/2028': BEGIN_DAYLIGHT,
	'3/11/2029': BEGIN_DAYLIGHT,
	// end daylight savings
	'11/2/2025': END_DAYLIGHT,
	'11/1/2026': END_DAYLIGHT,
	'11/7/2027': END_DAYLIGHT,
	'11/5/2028': END_DAYLIGHT,
	'11/4/2029': END_DAYLIGHT,

	// memorial day
	'5/26/2025': MEMORIAL,
	'5/25/2026': MEMORIAL,
	'5/31/2027': MEMORIAL,
	'5/29/2028': MEMORIAL,
	'5/28/2029': MEMORIAL,

	// labor day
	'9/1/2025': LABOR,
	'9/7/2026': LABOR,
	'9/6/2027': LABOR,
	'9/4/2028': LABOR,
	'9/3/2029': LABOR,

	// election day
	'11/4/2025': ELECTION,
	'11/9/2026': ELECTION,
	'11/8/2027': ELECTION,
	'11/13/2028': ELECTION,
	'11/12/2029': ELECTION,

	// easter
	'4/20/2025': EASTER,
	'4/5/2026': EASTER,
	'3/28/2027': EASTER,
	'4/16/2028': EASTER,
	'4/1/2029': EASTER,

	// spring
	'3/20/2025': SPRING,
	'3/20/2026': SPRING,
	'3/20/2027': SPRING,
	'3/20/2028': SPRING,

	// summer
	'6/21/2025': SUMMER,
	'6/21/2026': SUMMER,
	'6/21/2027': SUMMER,
	'6/20/2028': SUMMER,

	// fall
	'9/22/2025': FALL,
	'9/23/2026': FALL,
	'9/23/2027': FALL,
	'9/22/2028': FALL,

	// winter
	'12/21/2024': WINTER,
	'12/21/2025': WINTER,
	'12/21/2026': WINTER,
	'12/22/2027': WINTER,
	'12/21/2028': WINTER,

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
