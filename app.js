require('./preload/preload');

var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var less = require('less-middleware');
var session = require('express-session');
var socketIo = require('socket.io');
var appSoc = require('./sock/sock');

var app = express();
var server = http.createServer(app);
var io = socketIo(server);

global.__appname = __dirname + '/';
global.__env = app.get('env');
global.__io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(less(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'express.io makes me very happy', resave: true, saveUninitialized: true}));

// altp
var altp = require('./routes/altp/altp');
var altpSock = require('./routes/altp/sock');
app.use('/altp', altp);
altpSock.init(io);

// 404 must below all of other routes.
// If a route should not be found, it must be a 404 error
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler will print stacktrace
if (app.get('env') === 'development') {
    console.log('DEV mode enabled');
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler no stack traces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });

    // write down to log/ files
    if (err.status && err.status >= 500) {
        log.log('error', err.message, {stacktrace: err.stack});
    }
});

var ip = process.env.OPENSHIFT_NODEJS_IP || '192.168.1.102';
var port = process.env.OPENSHIFT_NODEJS_PORT || 8081;

server.listen(port, ip, function () {
    appSoc.init(app, io);
    console.log('Server listening at %s:%d', ip, port);
});

