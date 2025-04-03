const max = 8;
let messageContainer;
let dialog;
let element;
let value = 0;

document.addEventListener('DOMContentLoaded', () => {
	// event handlers
	document.querySelector('#dialog-messages-reset').addEventListener('click', refresh);
	document.querySelector('#dialog-messages-copy').addEventListener('click', copy);
	document.querySelector('#dialog-messages.dialog .close').addEventListener('click', hideMessages);
	// document.getElementById('dialog-messages-retry').addEventListener('click', hideMessages);

	// get elements
	element = document.querySelector('#progressbar');
	dialog = document.querySelector('#dialog-messages');
	messageContainer = dialog.querySelector('.content');

	// setup the progress bar
	progressBar(0);
});

const progressBar = (newValue) => {
	// typeof value === number
	// special case for going backwards
	if (newValue < value) {
		show();
		element.classList.add('reset');
		element.style.width = '0%';
		setTimeout(() => {
			element.classList.remove('reset');
		}, 1);
	} else {
		element.style.width = `${((newValue / max) * 100)}%`;
	}

	value = newValue;
};

// update the progress bar
const set = (msg, _amount = 1, _error = false) => {
	let amount = _amount;
	let error = _error;
	if (typeof amount === 'boolean') {
		amount = 1;
		error = amount;
	}
	// output message
	message(msg, error, 'progress');
	// update value
	const newValue = value + amount;
	// set progress bar
	progressBar(newValue);
	// show the progress bar
	show();
	// test for full and fade out progress bar
	if (newValue >= max) {
		hide();
	}
};

const show = () => {
	element.classList.add('show');
};

const hide = () => {
	element.classList.remove('show');
};

const reset = (msg) => {
	progressBar(0);
	show();
	message(`Loading new forecast: ${msg}`, false, 'new');
};

// error and style are optional
const message = (msg, _error = false, _style = '') => {
	let style = _style;
	let error = _error;

	// eslint-disable-next-line no-console
	console.log(msg);
	if (typeof error === 'string') {
		style = error;
		error = false;
	}
	const classes = style.split(' ').filter((d) => d !== '');
	if (error) classes.push('error');

	const formattedMessage = document.createElement('div');
	formattedMessage.textContent = msg;
	if (classes.length > 0) formattedMessage.classList.add(...classes);

	// scroll if necessary
	const mustScroll = messageContainer.scrollHeight - messageContainer.clientHeight - messageContainer.scrollTop < 5;

	messageContainer.append(formattedMessage);
	if (mustScroll) messageContainer.scrollTop = messageContainer.scrollHeight;
};

const showMessages = () => {
	dialog.classList.remove('initial-hide');
	dialog.classList.add('show');
	// always scroll to bottom, and again after expansion animation
	messageContainer.scrollTop = messageContainer.scrollHeight;
	setTimeout(() => { messageContainer.scrollTop = messageContainer.scrollHeight; }, 500);
};

const hideMessages = () => {
	dialog.classList.remove('show');
};

// refresh the page and unload the service worker (hidden feature on version number click)
const refresh = async () => {
	if ('serviceWorker' in navigator) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		registrations.forEach((registration) => registration.unregister());
	}
	document.location.reload();
};

const copy = () => {
	// prepare the text
	const strings = [...document.querySelectorAll('#dialog-messages .content div:not(.no-copy)')].map((elem) => elem.innerText.trim());
	strings.push((new Date()).toGMTString());
	const text = strings.join('\r\n');
	navigator.clipboard.writeText(text).then(() => {
		dialog.classList.add('copy-animation');
		setTimeout(() => dialog.classList.remove('copy-animation'), 300);
	});
};

export {
	set, reset, message, showMessages, hideMessages,
};
