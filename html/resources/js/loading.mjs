import { forEachElem } from './utils.mjs';

const LOADING_CURRENT_SELECTOR = '#loading-current';
const LOADING_NEXT_SELECTOR = '#loading-next';

// get a random loading text
const randomLoadingText = (current) => {
	let newText = '';
	do {
		const i = Math.floor(Math.random() * randomLoadingText.strings.length);
		newText = `${randomLoadingText.strings[i]}...`;
	} while (current === newText);
	return newText;
};

// animate throbber, private
// animates the throbber when it is visible
const animateThrobber = (_state = 0) => {
	// state is the class suffix, a x.0 = fade in, x.5 = fade out
	// get state or use default value
	let state = _state || 0;

	// skip animation if throbber is not visible
	if (!document.querySelector('#loading').classList.contains('show')) {
		// try again next time
		setTimeout(() => {
			animateThrobber(state);
		}, 200);
		return;
	}

	// test for limit
	if (state >= document.querySelectorAll('[id^=throbber]').length) state = 0;
	const throbberId = `#throbber-${Math.floor(state)}`;
	const show = (state - Math.floor(state) === 0);
	const throbber = document.querySelector(throbberId);

	// increment state
	state += 0.5;
	throbber.style.opacity = show ? 1 : 0;
	setTimeout(() => animateThrobber(state), 200);
};

// animate the loading text
// animates the loading text when it is visible
// step 0 = swap in new text, step 1 = slide the swapped text back to its resting position
const animateLoadingText = (step = 0) => {
	// skip animation if throbber is not visible
	if (document.querySelector('#loading').classList.contains('hide')) {
		// try again next time
		setTimeout(() => animateLoadingText(0), 500);
		return;
	}

	// get the elements
	const nextElem = document.querySelector(LOADING_NEXT_SELECTOR);
	const currentElem = document.querySelector(LOADING_CURRENT_SELECTOR);

	if (step === 0) {
		// get current text so there's no duplicates
		const newText = randomLoadingText(nextElem.textContent);

		// switch out the new text with the current
		if (nextElem.textContent !== '') {
			currentElem.textContent = nextElem.textContent;
		}
		// swap back to original positions
		currentElem.classList.remove('second');
		nextElem.classList.remove('second');
		// put the new text into the "next" position
		nextElem.textContent = newText;

		setTimeout(() => animateLoadingText(1), 900);
	} else {
		// slide current text out and new text in
		currentElem.classList.add('second');
		nextElem.classList.add('second');

		setTimeout(() => animateLoadingText(0), 900);
	}
};

document.addEventListener('DOMContentLoaded', () => {
	// get the loading text
	randomLoadingText.strings = [];
	forEachElem('.hidden-placeholders .loading li', (elem) => randomLoadingText.strings.push(elem.innerText));

	// put an initial string on the page
	const startString = randomLoadingText();
	document.querySelector(LOADING_CURRENT_SELECTOR).innerHTML = startString;
	document.querySelector(LOADING_NEXT_SELECTOR).innerHTML = startString;

	// animate the throbber and loading text
	animateThrobber();
	setTimeout(animateLoadingText, 1000);
});
