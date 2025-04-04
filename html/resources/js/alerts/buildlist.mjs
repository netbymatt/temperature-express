import buildElem from './buildelem.mjs';

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
		const list = type.map(buildElem);
		ul.append(...list);

		return docFragment;
	});
};

export default buildList;
