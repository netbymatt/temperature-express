// launch express to serve files
const express = require('express');
const path = require('path');
const apiPassthru = require('./apipassthru');

const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');
app.use('/resources/dev/flot', express.static('flot/source'));
app.use('/dist', express.static('dist'));
app.use('/resources', express.static('./html/resources'));
app.use('/images', express.static('./html/images'));

// pass through to api
app.use('/points', apiPassthru);
app.use('/gridpoints', apiPassthru);
app.use('/stations', apiPassthru);
app.use('/alerts', apiPassthru);
app.use('/products', apiPassthru);

// root document
app.use('/', (req, res, next) => {
	if (req.originalUrl === '/') {
		res.render(path.join(__dirname, './html/index'), { version: null, _apiUrl: `http://localhost:${PORT}/` });
	} else {
		next();
	}
});
app.use('/*url', express.static(path.join(__dirname, './html')));

app.listen(PORT);
