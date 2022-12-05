const holidaySource = {
	'12/25': 'tree',
	'12/24': 'sleigh',
	'1/1': 'glass-cheers',
	'2/14': 'heart',
	'7/4': 'flag-usa',
	'6/14': 'flag-usa',
	'12/11': 'syringe',
	'10/31': 'ghost',
	'11/11': 'monument',

	// thanksgiving
	'11/24/2022': 'drumstick-bite',
	'11/23/2023': 'drumstick-bite',
	'11/28/2024': 'drumstick-bite',
	'11/27/2025': 'drumstick-bite',
	'11/26/2026': 'drumstick-bite',
	'11/25/2027': 'drumstick-bite',
	'11/23/2028': 'drumstick-bite',
	'11/22/2029': 'drumstick-bite',
	'11/28/2030': 'drumstick-bite',

	// begin daylight savings
	'3/13/2022': 'clock',
	'3/12/2023': 'clock',
	'3/10/2024': 'clock',
	// end daylight savings
	'11/6/2022': 'clock',
	'11/5/2023': 'clock',
	'11/3/2024': 'clock',

	// memorial day
	'5/30/2022': 'monument',
	'5/29/2023': 'monument',
	'5/27/2024': 'monument',
	'5/26/2025': 'monument',
	'5/25/2026': 'monument',
	'5/31/2027': 'monument',
	'5/29/2028': 'monument',
	'5/28/2029': 'monument',

	// labor day
	'9/5/2022': 'industry',
	'9/4/2023': 'industry',
	'9/2/2024': 'industry',
	'9/1/2025': 'industry',
	'9/7/2026': 'industry',
	'9/6/2027': 'industry',
	'9/4/2028': 'industry',
	'9/3/2029': 'industry',

	// election day
	'11/8/2022': 'vote-yea',
	'11/7/2023': 'vote-yea',
	'11/5/2024': 'vote-yea',
	'11/4/2025': 'vote-yea',
	'11/9/2026': 'vote-yea',
	'11/8/2027': 'vote-yea',
	'11/13/2028': 'vote-yea',
	'11/12/2029': 'vote-yea',

	// easter
	'4/17/2022': 'egg',
	'4/9/2023': 'egg',
	'3/31/2024': 'egg',
	'4/20/2025': 'egg',
	'4/5/2026': 'egg',
	'3/28/2027': 'egg',
	'4/16/2028': 'egg',
	'4/1/2029': 'egg',

	// spring
	'3/20/2022': 'seedling',
	'3/20/2023': 'seedling',
	'3/19/2024': 'seedling',
	'3/20/2025': 'seedling',
	'3/20/2026': 'seedling',

	// summer
	'6/21/2022': 'sun',
	'6/21/2023': 'sun',
	'6/20/2024': 'sun',
	'6/20/2025': 'sun',
	'6/21/2026': 'sun',

	// fall
	'9/22/2022': 'leaf',
	'9/23/2023': 'leaf',
	'9/22/2024': 'leaf',
	'9/22/2025': 'leaf',
	'9/22/2026': 'leaf',

	// winter
	'12/21/2022': 'snowflake',
	'12/21/2023': 'snowflake',
	'12/21/2024': 'snowflake',
	'12/21/2025': 'snowflake',
	'12/21/2026': 'snowflake',

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
