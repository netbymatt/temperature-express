// launch express to serve files
const express = require('express');
const path = require('path');

const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');
app.use('/resources/dev/flot', express.static('flot/source'));
app.use('/dist', express.static('dist'));
app.use('/*', (req, res, next) => {
	if (req.originalUrl === '/') {
		res.render(path.join(__dirname, './html/index'), { version: null, _apiUrl: `http://localhost:${PORT}/` });
	} else {
		next();
	}
});
app.use('/', express.static(path.join(__dirname, './html')));

const apiPassthru = require('./apipassthru');

// pass through to api
app.use('/points', apiPassthru);
app.use('/gridpoints', apiPassthru);
app.use('/stations', apiPassthru);
app.use('/alerts', apiPassthru);
app.use('/products', apiPassthru);

app.listen(PORT);
