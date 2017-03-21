"use strict";
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var apiRoutes_1 = require('./apiRoutes');
var settings_1 = require('./settings');
var cookieParser = require('cookie-parser'); // this module doesn't use the ES6 default export yet
var app = express();
app.use(function (req, res, next) {
    console.log(req.method);
    next();
});
app.use(logger('dev'));
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: 1000000000 })); // Max size of the file to be uploaded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(settings_1.default().client));
app.use('/', apiRoutes_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
// error handlers
var errorpage = fs.readFileSync(path.join(__dirname, 'error.html'), 'utf8');
function handleError(error, req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(error['status'] || 500);
    if (req.originalUrl.substr(0, 5) === '/api/') {
        res.json({ error: error && error.message ? error.message : 'Internal error ' });
    }
    else {
        res.send(errorpage);
    }
}
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (error, req, res, next) {
        handleError(error, req, res);
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (error, req, res, next) {
    handleError(error, req, res);
    return error;
});
exports.default = app;