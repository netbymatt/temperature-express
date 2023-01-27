import { DateTime, Duration } from '../../vendor/luxon.mjs';

// build a list of alerts
const buildList = (data, initialShow) => {
	// loop through types
	// determine initial state
	const docFragment = document.createDocumentFragment();

	return Object.entries(data).map(([key, type]) => {
		const h3 = document.createElement('h3');
		h3.textContent = key;
		docFragment.append(h3);
		// check for active
		if (!type.isActive) h3.classList.add('inactive');
		const ul = document.createElement('ul');
		if (!initialShow) ul.classList.add('hidden');
		docFragment.append(ul);

		// loop through each alert, already sorted with newest first
		type.forEach((alert) => {
			const li = document.createElement('li');
			if (!alert.isActive) li.classList.add('inactive');
			ul.append(li);

			const h4 = document.createElement('h4');
			h4.textContent = alert.headline;
			li.append(h4);

			const divState = document.createElement('div');
			if (!alert.isActive) divState.classList.add('hidden');
			li.append(divState);

			const divDescription = document.createElement('div');
			divDescription.textContent = formatDescription(alert.description);
			li.append(divDescription);

			const divInstruction = document.createElement('div');
			divInstruction.textContent = alert.instrcution ?? '';
			li.append(divInstruction);

			const divTimes = document.createElement('div');
			divTimes.classList.add('times');
			li.append(divTimes);

			const divSent = document.createElement('div');
			divSent.textContent = `Sent: ${relative(alert.sent)}`;
			divTimes.append(divSent);
			const divEffective = document.createElement('div');
			divEffective.textContent = `Effective: ${relative(alert.effective)}`;
			divTimes.append(divEffective);
			const divEnds = document.createElement('div');
			divEnds.textContent = `Ends: ${relative(alert.ends || alert.expires)}`;
			divTimes.append(divEnds);
		});
		return docFragment;
	});
};

// crude formatting of description
const formatDescription = (text) => text
	// .replace(/(?<!^)\* /g, '<br/>')	// turn the *(space) into a newline, except at the very beginning of the string
	.replace('* ', '');	// remove the *(space)

// setup formatting relative time formatting
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// return a relative time
const relative = (time) => {
	// convert time to a duration of hours
	const now = DateTime.utc();
	const event = DateTime.fromISO(time);
	const duration = Duration.fromMillis(event.toMillis() - now.toMillis());
	const hours = duration.as('hour');
	let unit = 'hour';
	let asUnit = hours;
	// determine units
	if (Math.abs(hours) < 1.5) {
		unit = 'minute';
		asUnit = Math.round(hours * 60);
	} else if (Math.abs(hours) > 18) {
		unit = 'day';
		asUnit = Math.round(hours / 24);
	} else {
		asUnit = Math.round(hours);
	}

	return `${rtf.format(asUnit, unit)}, ${event.toLocaleString(DateTime.DATETIME_SHORT)}`;
};

export default buildList;
