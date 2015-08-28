var express = require('express'),
    router = express.Router(),
    passwordHash = require('password-hash'),
    validator = require('validator'),
    nodemailer = require('nodemailer'),
    ObjectId = require('mongodb').ObjectId;

var transporter = nodemailer.createTransport(
    {
        service: 'Gmail',
        auth: {
            user: 'egayigor@gmail.com',
            pass: 'mia910ei'
        }
    }
);


router.get('/signup/', function (req, res) {
    'use strict';
    res.render('user/login', {
        curPage: '/users/signup/',
        message : req.flash('info'),
        formAction : '/users/signup/',
        btnValue : 'signup'
    });
});



router.post('/signup/', function (req, res) {
    'use strict';
    var db = req.db,
        userCol = db.get('users'),
        rand = Math.random(),
        userEmail      = req.body.useremail || null,
        userPassword   = req.body.password ? passwordHash.generate(req.body.password) : null;

    userCol.findOne({ email :  userEmail }, function (err, doc) {
        if (err) { throw err; }
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
        }, function () {
            var link = 'http://' + req.get('host') + '/users/email_activation?random=' + rand + '&email=' + userEmail,
                mailOptions = {
                    to: userEmail,
                    subject: req.app.locals.i18n('confirm'),
                    html: '<head><style>a:hover{border: 2px solid;}</style></head>' +
                        '<body style="background:#EAF1F1"><div align="center" style="height: 800px; padding: 50px">' +
                        '<div style="margin-top: 60px; margin-bottom: 60px; background-color: #7FB1B3; padding: 20px">' +
                        '<p align="center" style="font-family: Arial,Helvetica,sans-serif; font-size: 30px; color: gold;">' +
                        req.app.locals.i18n('congratulations') + '</p><p align="center" ' +
                        'style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: white;">' +
                        req.app.locals.i18n('bravitoIs') + '<br>' + req.app.locals.i18n('now') + '</p><br>' +
                        '<p align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; color: white;">' +
                        req.app.locals.i18n('just') + '</p><a href=' + link + ' style="font-size: 25px;' +
                        'margin: 0 auto; background: goldenrod; border-radius: 10px; padding: 10px 40px 10px 40px;' +
                        'color: white; white-space: nowrap; text-decoration: none">' + req.app.locals.i18n('click') +
                        '</a><p align="center" style="font-family: Arial, Helvetica, sans-serif;' +
                        'font-size: 30px; color: white;">' + req.app.locals.i18n('wish') + '</p></div></div></body>'
                };
            transporter.sendMail(mailOptions, function (err, res) {
                if (err) {
                    res.render('default', { msg : 'Something was wrong' });
                }
            });
            res.render('default', { msg : req.app.locals.i18n('check') });
        });
    }
});

router.get('/email_activation', function (req, res) {
    'use strict';
    var db = req.db,
        userCol = db.get('users');
    userCol.findOne({ email : req.query.email }, function (err, doc) {
        if (err) { throw err; }
        if (!req.query.random) {
            /*jslint nomen: true*/
            req.session.user_id = doc._id;
            req.session.email = doc.email;
            req.flash('info', req.app.locals.i18n('passMsg'));
            res.redirect('/users/edit');
            return;
        }
        if (req.query.random == doc.secure_code) {
            userCol.findAndModify({ _id : doc._id }, { $set:  { active : 'yes' }});
            req.session.user_id = doc._id;
            /*jslint nomen: false*/
            req.session.email = doc.email;
            res.redirect('/users/profile');
        } else {
            res.render('default', {msg: 'Bad request'});
        }
    });
});


router.get('/password_recovery', function (req, res) {
    'use strict';
    res.render('user/recovery', {
        curPage: '/users/password_recovery',
        message : req.flash('info')
    });
});

router.post('/recovery', function (req, res) {
    'use strict';
    var email = req.body.email,
        link,
        mailOptions;
    if (!validator.isEmail(email)) {
        req.flash('info', req.app.locals.i18n('emailErr'));
        res.redirect('/users/password_recovery');
    } else {
        link = 'http://' + req.get('host') + '/users/email_activation?email=' + email;
        mailOptions = {
            to: email,
            subject: 'Change password',
            html: '<head><style>a:hover{border: 2px solid;}</style></head><body style="background:#EAF1F1">' +
                '<div align="center" style="height: 800px; padding: 50px">' +
                '<div style="margin-top: 60px; margin-bottom: 60px; background-color: #7FB1B3; overflow:hidden;' +
                'padding: 20px"><p style="font-family: Arial,Helvetica,sans-serif; font-size: 30px; color: gold;">' +
                req.app.locals.i18n('lose') + '</p>' +
                '<p style="font-family: Arial,Helvetica,sans-serif; font-size: 20px;color: white;">' +
                req.app.locals.i18n('clickThe') + '</p>' +
                '<a href="' + link + '", style="font-size: 25px; margin: 0 auto; background: goldenrod; border-radius:10px;' +
                ' padding: 5px 30px 5px 30px;color: white; white-space: nowrap;text-decoration: none">' +
                req.app.locals.i18n('changePass') + '</a></div></div></body>'
        };
        transporter.sendMail(mailOptions, function (err, res) {
            if (err) {
                res.render('default', { msg : 'Something was wrong' });
            }
        });
        res.render('default', { msg : req.app.locals.i18n('check') });
    }
});


router.get('/login', function (req, res) {
    'use strict';
    res.render('user/login', {
        curPage: '/users/login',
        message : req.flash('info'),
        formAction : '/users/login',
        btnValue : 'login'
    });
});

router.post('/login', function (req, res) {
    'use strict';
    var db = req.db,
        userCol = db.get('users');
    userCol.findOne({email : req.body.useremail}, function (err, doc) {
        if (err) { throw err; }

        if (doc && passwordHash.verify(req.body.password, doc.password)) {
            if (doc.active == 'no') {
                req.flash('info', req.app.locals.i18n('inactiveUserAccount'));
                res.redirect('/users/login');
                return;
            }
            /*jslint nomen: true*/
            req.session.user_id = doc._id;
            /*jslint nomen: false*/
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
    'use strict';
    if (!req.session.user_id) {
        req.flash('info', req.app.locals.i18n('notLogin'));
        res.redirect('/users/login');
    } else {
        next();
    }
}


router.get('/profile', checkAuth, function (req, res) {
    'use strict';
    var db = req.db,
        adCol = db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        adStatus = req.query.status || 'active',
        pages = [],
        p;
    /*jslint nomen: true*/
    adCol.find({ user_id : new ObjectId(req.session.user_id), status: adStatus }, {
        skip: perPage * page,
        limit: perPage,
        sort: { _id : -1 }
    }, function (err, ads) {
        if (err) { throw err; }
        /*jslint nomen: false*/
        adCol.count({ user_id : new ObjectId(req.session.user_id), status: 'active' }, function (err, countActive) {
            if (err) { throw err; }
            adCol.count({ user_id : new ObjectId(req.session.user_id), status: 'inactive' }, function (err, countInactive) {
                if (err) { throw err; }
                for (p = 0; p < (adStatus == 'active' ? countActive : countInactive) / perPage; p++) {
                    pages.push({
                        link: '/users/profile?page=' + p,
                        pg: p + 1

                    });
                }

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


router.get('/edit', checkAuth, function (req, res) {
    'use strict';
    var db = req.db,
        userCol = db.get('users');
    userCol.findById(req.session.user_id, function (err, doc) {
        if (err) {
            res.send('No user found.');
        } else {
            res.render('user/edit', {
                curPage: '/users/edit',
                user : doc,
                message : req.flash('info')
            });
        }
    });
});


router.post('/edit', checkAuth, function (req, res) {
    'use strict';
    var colObject = {
        name: req.body.name,
        telephone: req.body.telephone
    },
        isPasswordSpecified = req.body.newpass1 != '',
        db, userCol;

    if (isPasswordSpecified && req.body.newpass1 == req.body.newpass2) {
        colObject.password = passwordHash.generate(req.body.newpass1);
    } else if (isPasswordSpecified && req.body.newpass1 != req.body.newpass2) {

        req.flash('info', req.app.locals.i18n('userPasswordsNotIdentical'));
        res.redirect('/users/edit');

        return;
    }

    db = req.db;
    userCol = db.get('users');

    /*jslint nomen: true*/
    userCol.findAndModify({ _id: req.session.user_id }, { $set: colObject }).success(function () {
        /*jslint nomen: false*/
        res.redirect('/users/edit');
    });

});


router.get('/logout', function (req, res) {
    'use strict';
    delete req.session.user_id;
    delete req.session.email;
    delete req.session.isAdmin;
    res.redirect('/');
});


module.exports = router;
