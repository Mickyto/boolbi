var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var validator = require('validator');
var monk = require('monk');
var db = monk('mongo:27017/boolbi');

var routes = require('./routes/index');
var users = require('./routes/users');
var ads = require('./routes/ads');
var admin = require('./routes/admin');
var i18n = require('./dictionaries');
var pagination = require('./pagination');
var dateHandler = require('./dateHandler');

var app = express();

/*jslint unparam: true*/
/*jslint sloppy: true*/
/*jslint nomen: true*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(function (req, res, next) {
    req.pagination = pagination;
    req.dateHandler = dateHandler;
    next();
});

app.use(function (req, res, next) {
    req.session.locale  =  req.session.lang || 'ru';
    req.app.locals.i18n = i18n[req.session.locale];
    next();
});

app.use(function (req, res, next) {
    db.get('categories').find({}, function (err, categories) {
        res.locals.categories = categories;
        next();
    });
});

app.use(function (req, res, next) {
    var adCol = db.get('ads');
    adCol.count({ improvement: 'main'}, function (err, count) {
        var random = parseInt(Math.random() * (count - 2), 10);
        adCol.find({ improvement: 'main'}, { limit: 3, skip: random }, function (err, ads) {
            res.locals.mainAds = ads;
            next();
        });
    });
});

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

app.use(function (req, res, next) {
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/ads', ads);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.render('error', {
        message: err.message,
        error: err
    });
    //next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;