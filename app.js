var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));
app.use(bodyParser.raw({limit: '50mb'}));
app.use(fileUpload());

//cors middleware
require('./config/middleware')(app);
require('./config/cors')(app);
require('./config/database');
require('./config/modules')(app);

//resolvendo problema do header
app.use(function (req, res, next) {
    var _send = res.send;
    var sent = false;
    res.send = function (data) {
        if (sent) return;
        _send.bind(res)(data);
        sent = true;
    };
    next();
});

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
