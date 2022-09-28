import { DateTime } from '../vendor/luxon.min.mjs';

// initialize
document.addEventListener('DOMContentLoaded', () => {
	// add double click handler = select all
	document.querySelector('#table table').addEventListener('dblclick', selectTable);
});

const showTable = (data) => {
	// table html
	const tableHtml = buildFullTable(data);

	// put table on page
	document.querySelector('#table table').innerHTML = tableHtml;

	// show the table
	toggleTable(true);
};

// build full table, private
// builds a table with each individual data point
const buildFullTable = (data) => {
	// start building the table
	let html = '';
	// table header
	let tableHeader = '<tr><td>Timestamp</td>';

	// loop through all legends
	data.forEach((series) => {
		// hide values that are not every hour by testing data length
		if (series.lines.show && !series.isObs && series.data.length >= data[0].data.length) {
			tableHeader += `<td>${series.label}</td>`;
		}
	});
	// finish header
	tableHeader += '</tr>';

	// add header to table
	html += `<thead>${tableHeader}</thead>`;

	// start the body
	html += '<tbody>';

	// store the date for table formatting
	let lastDay = 0;

	// loop through the data by row
	for (let i = 0; i < data[0].data.length; i += 1) {
		// timestamp
		const dt = DateTime.fromMillis(data[0].data[i][0], { zone: 'UTC' });

		// timestamp (day of week, day, hour:minute)
		html += `<tr${
			// new day
			(dt.c.day !== lastDay) ? ' class="new-day"' : ''
		}>`
				+ `<td>${dt.toLocaleString({ weekday: 'short' })} ${
					dt.toLocaleString({ month: 'short', day: '2-digit' })} ${
					dt.toLocaleString({ hour: 'numeric' })}</td>`;

		// loop through visible columns
		const dataHtml = data.map((series) => {
			// hide values that are not every hour by testing data length
			if (series.lines.show && !series.isObs && series.data.length >= data[0].data.length) {
				if (i < series.data.length) {
					return `<td>${
						// hide null values
						series.data[i][1]?.toFixed?.(series.scale.currentPrecision) ?? ''
					}</td>`;
				}
				return '<td></td>';
			}
			return '';
		});
			// finish up row
		html += `${dataHtml.join('')}</tr>`;

		// remember day
		lastDay = dt.c.day;
	}

	// finish up body
	html += '</tbody>';
	// add the header again as the footer
	html += `<tfoot>${tableHeader}</tfoot>`;

	return html;
};

// toggle table, public
// show the table (true) or chart
const toggleTable = (show, includeChart = true) => {
	// get elements
	const tableElem = document.getElementById('table');
	const chartElem = document.getElementById('chart-container');
	const tableMenuElem = document.querySelector('#menu-table div.table');
	const chartMenuElem = document.querySelector('#menu-table div.chart');
	// toggle the menu text
	if (show) {
		tableElem.classList.add('show');
		tableMenuElem.style.display = 'none';
		if (includeChart) {
			chartElem.classList.remove('show');
			chartMenuElem.style.display = 'block';
		}
	} else {
		tableElem.classList.remove('show');
		tableMenuElem.style.display = 'block';
		if (includeChart) {
			chartElem.classList.add('show');
			chartMenuElem.style.display = 'none';
		}
	}
};

// select table, private
// selects all text in table for easy copying
const selectTable = () => {
	const elem = document.querySelector('#table table');
	const selection = elem.ownerDocument.defaultView.getSelection();
	const range = elem.ownerDocument.createRange();
	range.selectNodeContents(elem);
	selection.removeAllRanges();
	selection.addRange(range);
};

export {
	showTable,
	toggleTable,
};
