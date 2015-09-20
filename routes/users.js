
/*jslint sloppy: true*/
/*jslint nomen: true*/

var express = require('express'),
    router = express.Router(),
    passwordHash = require('password-hash'),
    validator = require('validator'),
    ObjectId = require('mongodb').ObjectId;

var api_key = 'key-2f09c76695a377a13554a4f01e97d874';
var domain = 'sandbox71a7c0ea57d9420f9225d30c97a3d8d9.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});


router.get('/signup/', function (req, res) {

    res.render('user/login', {
        curPage: '/users/signup/',
        message : req.flash('info'),
        formAction : '/users/signup/',
        btnValue : 'signup'
    });
});


router.post('/signup/', function (req, res, next) {

    var link,
        data,
        userCol = req.db.get('users'),
        rand = Math.random(),
        userEmail      = req.body.useremail || null,
        userPassword   = req.body.password ? passwordHash.generate(req.body.password) : null;

    userCol.findOne({ email :  userEmail }, function (err, doc) {
        if (err) { return next(err); }

        if (doc) {
            req.flash('info', req.app.locals.i18n('exist'));
            res.redirect('/users/signup/');
        }
    });

    if (userEmail === null || userPassword === null) {

        req.flash('info', req.app.locals.i18n('wrong'));
        res.redirect('/users/signup/');

    } else {

        userCol.insert({
            email: userEmail,
            password: userPassword,
            active: 'no',
            secure_code: rand
        });

        link = 'http://' + req.get('host') + '/users/email_activation?random=' + rand + '&email=' + userEmail;
        data = {
            from: 'Savers <no-reply@mailgun.org>',
            to: userEmail,
            subject: req.app.locals.i18n('confirm')
        };

        res.render('email_activation', { link: link }, function (err, html) {
            if (err) { return next(err); }
            data.html = html;
        });

        mailgun.messages().send(data, function (err) {
            if (err) {
                res.render('default', { msg : 'Something was wrong' });
            }
        });

        res.render('default', { msg : req.app.locals.i18n('check') });
    }
});

router.get('/email_activation', function (req, res, next) {

    var userCol = req.db.get('users');

    userCol.findOne({ email : req.query.email }, function (err, doc) {
        if (err) { return next(err); }

        if (!req.query.random) {
            req.session.user_id = doc._id;
            req.session.email = doc.email;
            req.flash('info', req.app.locals.i18n('passMsg'));
            res.redirect('/users/edit');
            return;
        }

        if (req.query.random == doc.secure_code) {
            userCol.findAndModify({ _id : doc._id }, { $set:  { active : 'yes' }});
            req.session.user_id = doc._id;
            req.session.email = doc.email;
            res.redirect('/users/profile');
        } else {
            res.render('default', {msg: 'Bad request'});
        }
    });
});


router.get('/password_recovery', function (req, res) {

    res.render('user/recovery', {
        curPage: '/users/password_recovery',
        message : req.flash('info')
    });
});

router.post('/recovery', function (req, res, next) {

    var email = req.body.email,
        link,
        data;
    if (!validator.isEmail(email)) {
        req.flash('info', req.app.locals.i18n('emailErr'));
        res.redirect('/users/password_recovery');
    } else {
        link = 'http://' + req.get('host') + '/users/email_activation?email=' + email;
        data = {
            from: 'Savers <no-reply@mailgun.org>',
            to: email,
            subject: req.app.locals.i18n('changePass')
        };

        res.render('recovery', { link: link }, function (err, html) {
            if (err) { return next(err); }
            data.html = html;
        });

        mailgun.messages().send(data, function (err) {
            if (err) {
                res.render('default', { msg : 'Something was wrong' });
            }
        });

        res.render('default', { msg : req.app.locals.i18n('check') });
    }
});


router.get('/login', function (req, res) {

    res.render('user/login', {
        curPage: '/users/login',
        message : req.flash('info'),
        formAction : '/users/login',
        btnValue : 'login'
    });
});

router.post('/login', function (req, res, next) {

    var userCol = req.db.get('users');

    userCol.findOne({email : req.body.useremail}, function (err, doc) {
        if (err) { return next(err); }

        if (doc && passwordHash.verify(req.body.password, doc.password)) {

            if (doc.active == 'no') {
                req.flash('info', req.app.locals.i18n('inactiveUserAccount'));
                res.redirect('/users/login');
                return;
            }

            req.session.user_id = doc._id;
            req.session.isAdmin = doc.admin && doc.admin === 'yes' ? true : false;
            req.session.email = doc.email;
            res.redirect('/users/profile');
            return;
        }

        req.flash('info', req.app.locals.i18n('wrong'));
        res.redirect('/users/login');

    });
});


function checkAuth(req, res, next) {

    if (!req.session.user_id) {
        req.flash('info', req.app.locals.i18n('notLogin'));
        res.redirect('/users/login');
    } else {
        next();
    }
}

router.get('/profile', checkAuth, function (req, res, next) {

    var adCol = req.db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        adStatus = req.query.status || 'active',
        link = '/users/profile?status=' + adStatus + '&page=';

    adCol.find({ user_id : new ObjectId(req.session.user_id), status: adStatus }, {
        skip: perPage * page,
        limit: perPage,
        sort: { _id : -1 }
    }, function (err, ads) {
        if (err) { return next(err); }

        adCol.count({ user_id : new ObjectId(req.session.user_id), status: 'active' }, function (err, countActive) {
            if (err) { return next(err); }

            adCol.count({ user_id : new ObjectId(req.session.user_id), status: 'inactive' }, function (err, countInactive) {
                if (err) { return next(err); }

                var pages = req.pagination(perPage, (adStatus == 'active' ? countActive : countInactive), link);

                res.render('ad/ads', {
                    countActive: countActive,
                    countInactive: countInactive,
                    status: adStatus,
                    curPage: '/users/profile',
                    pages: pages,
                    pageIndex: page,
                    message: req.flash('info'),
                    ads: ads,
                    first: pages.slice(0, 1),
                    firstPart: pages.slice(0, 6),
                    middle: pages.slice(parseInt(page, 10) - 1, parseInt(page, 10)  + 3),
                    lastPart: pages.slice(-6),
                    last: pages.slice(-1)
                });
            });
        });
    });
});


router.get('/edit', checkAuth, function (req, res, next) {

    req.db.get('users').findById(req.session.user_id, function (err, doc) {
        if (err || !doc) { return next(err); }

        res.render('user/edit', {
            curPage: '/users/edit',
            user : doc,
            message : req.flash('info')
        });
    });
});


router.post('/edit', checkAuth, function (req, res) {

    var colObject = {
        name: req.body.name,
        telephone: req.body.telephone
    };

    if (req.body.newpass1 != '' && req.body.newpass1 == req.body.newpass2) {
        colObject.password = passwordHash.generate(req.body.newpass1);
    }

    if (req.body.newpass1 != '' && req.body.newpass1 != req.body.newpass2) {
        req.flash('info', req.app.locals.i18n('userPasswordsNotIdentical'));
        res.redirect('/users/edit');
        return;
    }

    req.db.get('users').findAndModify({ _id: req.session.user_id }, { $set: colObject });
    res.redirect('/users/edit');
});


router.get('/logout', checkAuth, function (req, res) {

    delete req.session.user_id;
    delete req.session.email;
    delete req.session.isAdmin;
    res.redirect('/');
});


module.exports = router;
