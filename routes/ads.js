var express = require('express');
var router = express.Router();
var methodOverride = require('method-override');
var fs = require('fs');
var multiPart = require('connect-multiparty');
var ObjectId = require('mongodb').ObjectId;
var Captchapng = require('captchapng');
var im = require('imagemagick');

var multipartMiddleware = multiPart();

/*jslint sloppy: true*/
/*jslint nomen: true*/
router.use(methodOverride(function (req) {

    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        delete req.body._method;
        return req.body._method;
    }
}));

function photoHandler(uploadedImage) {

    if (uploadedImage.size > 2000000) {
        return false;
    }

    if (uploadedImage.type == 'image/png' || uploadedImage.type == 'image/jpeg') {

        var imageName = Math.random() + '.jpg';

        im.resize({

            srcPath: uploadedImage.path,
            dstPath: './public/images/small/' + imageName,
            width: 200

        }, function (err) {
            if (err) { return err; }
        });

        im.resize({

            srcPath: uploadedImage.path,
            dstPath: './public/images/big/' + imageName,
            width: 600

        }, function (err) {
            if (err) { throw err; }
        });

        return imageName;
    }
    return false;
}

function checkAuth(req, res, next) {

    if (!req.session.user_id) {
        req.flash('info', 'Please log in');
        res.redirect('/users/login');
    } else {
        next();
    }
}

function imageCaptcha(captcha) {

    var img,
        imgbase64,
        p = new Captchapng(80, 30, captcha); // width,height,numeric captcha

    p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)
    img = p.getBase64();
    imgbase64 = new Buffer(img, 'base64').toString('base64');
    return imgbase64;
}

router.get('/newad', checkAuth, function (req, res, next) {

    req.db.get('users').findById(req.session.user_id, function (err, doc) {
        if (err) { return next(err); }
        if (!doc) {
            res.redirect('/users/profile');
            return;
        }
        var captcha = parseInt(Math.random() * 9000 + 1000, 10);
        req.session.captcha = captcha;
        res.render('ad/newad', {
            curPage: '/ads/newad',
            user: doc,
            formAction: '/ads/addad',
            captcha: imageCaptcha(captcha),
            message : req.flash('info')
        });
    });
});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {

    req.db.get('ads').findById(id, function (err, ad) {
        if (err) { return next(err); }

        if (!ad) {
            req.flash('info', req.app.locals.i18n('noAd'));
            res.redirect('/users/profile');
        } else {
            req.id = id;
            next();
        }
    });
});


router.get('/:id', function (req, res, next) {

    var db = req.db,
        userCol = db.get('users'),
        adCol = db.get('ads'),
        categoryCol = db.get('categories');

    adCol.findById(req.id, function (err, ad) {
        if (err) { return next(err); }

        categoryCol.findById(ad.category_id, function (err, category) {
            if (err) { return next(err); }

            userCol.findById(ad.user_id, function (err, user) {
                if (err) { return next(err); }

                res.render('ad/show', {
                    curPage: '/ads/' + req.id,
                    ad : ad,
                    category : category,
                    message : req.flash('info'),
                    user : user
                });
            });
        });
    });
});


router.get('/:id/edit', checkAuth, function (req, res, next) {

    var db = req.db,
        adCol = db.get('ads'),
        userCol = db.get('users'),
        categoryCol = db.get('categories'),
        captcha = parseInt(Math.random() * 9000 + 1000, 10);

    adCol.findById(req.id, function (err, ad) {
        if (err) { return next(err); }

        categoryCol.findById(ad.category_id, function (err, category) {
            if (err) { return next(err); }

            userCol.findById(ad.user_id, function (err, user) {
                if (err) { return next(err); }
                req.session.captcha = captcha;

                res.render('ad/newad', {
                    curPage: '/ads/' + req.id + '/edit',
                    user : user,
                    category : category,
                    ad : ad,
                    formAction: '/ads/' + req.id + '/adedit',
                    captcha: imageCaptcha(captcha),
                    message: req.flash('info')
                });
            });
        });
    });
});


var adCallback = function (req, res, next) {

    if (req.body.captcha != req.session.captcha) {
        req.flash('info', req.app.locals.i18n('noCaptcha'));
        res.redirect(req.id !== undefined ? '/ads/' + req.id + '/edit' : '/ads/newad');
        return;
    }

    var i,
        fieldName,
        imageName,
        db = req.db,
        adCol = db.get('ads'),
        colObject = {
            user_id : new ObjectId(req.session.user_id),
            title: req.body.adtitle,
            description: req.body.addescription,
            price: req.body.adprice,
            status: 'inactive'
        };

    // photo handler
    for (i = 1; i < 3; i++) {
        fieldName = 'image' + i;

        if (req.files[fieldName].name != '') {
            imageName = photoHandler(req.files[fieldName]);

            if (imageName === false) {
                req.flash('info', req.app.locals.i18n('incorrectImage'));
                res.redirect(req.id !== undefined ? '/ads/' + req.id + '/edit' : '/ads/newad');
                return;
            }
            colObject[fieldName] = imageName;
        }
    }

    // updating record
    if (req.id !== undefined) {

        // removing old pictures
        adCol.findOne({ _id: req.id, user_id: new ObjectId(req.session.user_id) }, function (err, doc) {
            if (err || !doc) { return next(err); }

            for (i = 1; i < 3; i++) {
                fieldName = 'image' + i;

                if (req.files[fieldName].name != '' && doc[fieldName] != undefined) {
                    fs.unlink('./public/images/big/' + doc[fieldName]);
                    fs.unlink('./public/images/small/' + doc[fieldName]);
                }
            }
            adCol.findAndModify({ _id: doc._id }, { $set: colObject });
        });
        res.redirect('/users/profile');

    // inserting record
    } else {

        db.get('categories').findById(req.body.category, function (err, doc) {
            if (err || !doc) { return next(err); }

            if (doc) {
                colObject.category_id = new ObjectId(req.body.category);
                adCol.insert(colObject);
            }
        });
        res.redirect('/users/profile');
    }
};


router.post('/addad', checkAuth, multipartMiddleware, adCallback);

router.post('/:id/adedit', checkAuth, multipartMiddleware, adCallback);

router.get('/:id/imgdel', checkAuth, function (req, res, next) {

    var i,
        imageNumber,
        db = req.db,
        adCol = db.get('ads'),
        imgObject = {};

    adCol.findOne({ _id: req.id, user_id: new ObjectId(req.session.user_id) }, function (err, doc) {
        if (err || !doc) { return next(err); }

        for (i = 1; i < 3; i++) {
            imageNumber = 'image' + i;

            if (req.query.img === doc[imageNumber]) {
                imgObject[imageNumber] = 1;
                fs.unlink('./public/images/big/' + req.query.img);
                fs.unlink('./public/images/small/' + req.query.img);
                adCol.findAndModify({_id: doc._id}, {$unset: imgObject});
            }
        }
    });
    res.redirect('/ads/' + req.id + '/edit');
});


router.delete('/:id', checkAuth, function (req, res, next) {

    var i,
        fieldName,
        db = req.db,
        adCol = db.get('ads');

    adCol.findOne({ _id: req.id, user_id: new ObjectId(req.session.user_id) }, function (err, doc) {
        if (err || !doc) { return next(err); }

        adCol.removeById(doc._id, function (err) {
            if (err) { return next(err); }
        });

        for (i = 1; i < 3; i++) {
            fieldName = 'image' + i;

            if (doc[fieldName] != undefined) {
                fs.unlink('./public/images/big/' + doc[fieldName]);
                fs.unlink('./public/images/small/' + doc[fieldName]);
            }
        }
    });
    res.redirect('/users/profile');
});

module.exports = router;
