import { DateTime, Duration } from '../../vendor/luxon.mjs';

const buildElem = (alert) => {
	const li = document.createElement('li');
	if (!alert.isActive) li.classList.add('inactive');

	const h4 = document.createElement('h4');
	h4.textContent = alert.headline;
	li.append(h4);

	const divState = document.createElement('div');
	if (!alert.isActive) divState.classList.add('hidden');
	li.append(divState);

	const divDescription = document.createElement('div');
	divDescription.textContent = formatDescription(alert.description);
	divState.append(divDescription);

	const divInstruction = document.createElement('div');
	divInstruction.textContent = alert.instrcution ?? '';
	divState.append(divInstruction);

	const divTimes = document.createElement('div');
	divTimes.classList.add('times');
	divState.append(divTimes);

	const divOnset = document.createElement('div');
	divOnset.textContent = `Onset: ${relative(alert.onset)}`;
	divTimes.append(divOnset);
	const divEnds = document.createElement('div');
	divEnds.textContent = `Ends: ${relative(alert.ends || alert.expires)}`;
	divTimes.append(divEnds);
	const divSent = document.createElement('div');
	divSent.classList.add('inactive');
	divSent.textContent = `Sent: ${relative(alert.sent)}`;
	divTimes.append(divSent);
	const divEffective = document.createElement('div');
	divEffective.classList.add('inactive');
	divEffective.textContent = `Effective: ${relative(alert.effective)}`;
	divTimes.append(divEffective);

	return li;
};

// crude formatting of description
const formatDescription = (text) => text?.replace('* ', '') ?? '';	// remove the *(space)
// .replace(/(?<!^)\* /g, '<br/>')	// turn the *(space) into a newline, except at the very beginning of the string

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

// setup formatting relative time formatting
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export default buildElem;
