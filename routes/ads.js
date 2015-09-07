var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
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
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

function photoHandler(uploadedImage) {
    var origPath = uploadedImage.path,
        imageHandle = './public/images/image_handle/' + uploadedImage.name,
        imageName = Math.random() + uploadedImage.name;

    fs.rename(origPath, imageHandle, function (err) {
        if (err) { throw err; }
        im.resize({
            srcPath: imageHandle,
            dstPath: './public/images/small/' + imageName,
            width:   200
        }, function (err) {
            if (err) { throw err; }

        });

        im.resize({
            srcPath: imageHandle,
            dstPath: './public/images/big/' + imageName,
            width:   600
        }, function (err) {
            if (err) { throw err; }

        });
    });

    return imageName;
}

function checkAuth(req, res, next) {
    if (!req.session.user_id) {
        req.flash('info', 'Please log in');
        res.redirect('/users/login');
    } else {
        next();
    }
}

function isUserHasAccessToAd(adId, req) {
    var db = req.db;
    db.get('ads').findById(adId, function (err, doc) {
        if (err) { throw err; }
        if (req.session.user_id != doc.user_id) {
            throw { name: 'NoAccess', message: 'You haven\'t access to ad' };
        }
    });
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

router.get('/newad', checkAuth, function (req, res) {
    var db = req.db,
        userCol = db.get('users');
    userCol.findById(req.session.user_id, function (err, doc) {
        if (err) { throw err; }
        var captcha = parseInt(Math.random() * 9000 + 1000, 10);
        req.session.captcha = captcha;
        res.render('ad/newad', {
            curPage: '/ads/newad',
            user: doc,
            ad: {
                title: '',
                description: '',
                price: ''
            },
            formAction: '/ads/addad',
            captcha: imageCaptcha(captcha),
            message : req.flash('info')
        });
    });
});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    var db = req.db,
        adCol = db.get('ads');
    adCol.findById(id, function (err) {
        if (err) {
            res.send(id + ' was not found');
        } else {
            req.id = id;
            next();
        }
    });
});


router.get('/:id', function (req, res) {
    var db = req.db,
        userCol = db.get('users'),
        adCol = db.get('ads'),
        categoryCol = db.get('categories');
    adCol.findById(req.id, function (err, ad) {
        if (err) { throw err; }
        categoryCol.findById(ad.category_id, function (err, category) {
            if (err) { throw err; }
            userCol.findById(ad.user_id, function (err, user) {
                if (err) { throw err; }
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


router.get('/:id/edit', checkAuth, function (req, res) {
    var db = req.db,
        adCol = db.get('ads'),
        userCol = db.get('users'),
        categoryCol = db.get('categories'),
        captcha = parseInt(Math.random() * 9000 + 1000, 10);
    adCol.findById(req.id, function (err, ad) {
        if (err) { throw err; }
        categoryCol.findById(ad.category_id, function (err, category) {
            if (err) { throw err; }
            userCol.findById(ad.user_id, function (err, user) {
                if (err) { throw err; }
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


var adCallback = function (req, res) {

    if (req.body.captcha != req.session.captcha) {
        req.flash('info', req.app.locals.i18n('noCaptcha'));
        res.redirect('/ads/newad');
        return;
    }

    var i,
        fieldName,
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
            colObject[fieldName] = photoHandler(req.files[fieldName]);
        }
    }

    // updating record
    if (req.id !== undefined) {

        try {
            isUserHasAccessToAd(req.id, req);
        } catch (e) { return e; }

        // removing old pictures
        adCol.findById(req.id, function (err, doc) {
            if (err) { throw err; }
            console.log(fieldName);
            if (req.files[fieldName].name != '' && doc[fieldName] != '') {
                fs.unlink('./public/images/big/' + doc[fieldName]);
                fs.unlink('./public/images/small/' + doc[fieldName]);
            }
        });

        adCol.findAndModify({ _id: req.id }, { $set: colObject });
        res.redirect('/ads/' + req.id);

    // inserting record
    } else {
        db.get('categories').findById(req.body.category, function (err, doc) {
            if (err) {
                req.flash('info', req.app.locals.i18n('noCategory'));
                res.redirect('/ads/newad');
            }
            if (doc) {
                colObject.category_id = new ObjectId(req.body.category);
                adCol.insert(colObject);
                res.redirect('/users/profile');
            }
        });
    }
};


router.post('/addad', checkAuth, multipartMiddleware, adCallback);

router.post('/:id/adedit', checkAuth, multipartMiddleware, adCallback);

router.get('/:id/imgdel', checkAuth, function (req, res) {

    try {
        isUserHasAccessToAd(req.id, req, res);
    } catch (e) {
        return e;
    }

    var db = req.db,
        adCol = db.get('ads'),
        imgObject = {};
    adCol.findById(req.id, function (err, doc) {
        if (err) { throw err; }
        if (req.query.img === doc.image1) {
            imgObject.image1 = 1;
        }
        if (req.query.img === doc.image2) {
            imgObject.image2 = 1;
        }
        adCol.findAndModify({ _id: req.id }, { $unset: imgObject });

        fs.unlink('./public/images/' + req.query.img);
        res.redirect('/ads/' + req.id + '/edit');

    });
});


router.delete('/:id', checkAuth, function (req, res) {

    try {
        isUserHasAccessToAd(req.id, req);
    } catch (e) {
        return e;
    }

    var db = req.db,
        adCol = db.get('ads');
    adCol.findById(req.id, function (err, doc) {
        if (err) { throw err; }
        if (doc.image1 !== undefined) {
            fs.unlink('./public/images/' + doc.image1);
        }
        if (doc.image2 !== undefined) {
            fs.unlink('./public/images/' + doc.image2);
        }
        adCol.removeById(req.id, function (err) {
            if (err) { throw err; }
            res.redirect('/users/profile');
        });
    });
});

module.exports = router;
