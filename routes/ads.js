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
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));


function photoHandler(files) {

    var Array = [];

    for (var i = 0; i < 2; i++) {

        var field = 'image' + i;

        if (files[field].name != '') {

            if (files[field].size > 3000000) {
                return false;
            }

            if (files[field].type == 'image/png' || files[field].type == 'image/jpeg') {

                var imageName = Math.random() + '.jpg';

                im.resize({
                    srcPath: files[field].path,
                    dstPath: './public/images/small/' + imageName,
                    width: 100
                }, function (err) {
                    if (err) { console.log(err); }
                });

                im.resize({
                    srcPath: files[field].path,
                    dstPath: './public/images/big/' + imageName,
                    width: 500
                }, function (err) {
                    if (err) { console.log(err); }
                });

                Array.push({
                    src: imageName,
                    fieldName: files[field].fieldName
                });
            }
        }
    }
    return Array;
}

function checkAuth(req, res, next) {

    if (!req.session.user_id) {
        req.flash('info', req.app.locals.i18n('notLogin'));
        res.redirect('/users/login');
    } else {
        next();
    }
}

function photoRemover(fileName) {

    try {
        fs.unlinkSync('./public/images/big/' + fileName);
        fs.unlinkSync('./public/images/small/' + fileName);
    }
    catch (err) {
        console.log(err);
        return false;
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
            title: req.app.locals.i18n('newad'),
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

        if (ad.images !== undefined) {
            var image = req.query.image || ad.images[0].src;
        }

        categoryCol.findById(ad.category_id, function (err, category) {
            if (err) { return next(err); }

            userCol.findById(ad.user_id, function (err, user) {
                if (err) { return next(err); }

                res.render('ad/show', {
                    title: ad.title,
                    image: image,
                    ad: ad,
                    category: category,
                    message: req.flash('info'),
                    user: user
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

        if (ad.images) {
            var arr = [];
            for (var i = 0; i < 2; i++) {
                var result = ad.images.filter(function( obj ) {
                    return obj.fieldName == 'image' + i;
                })[0];
                arr.push(result);
            }
        }

        categoryCol.findById(ad.category_id, function (err, category) {
            if (err) { return next(err); }

            userCol.findById(ad.user_id, function (err, user) {
                if (err) { return next(err); }
                req.session.captcha = captcha;

                res.render('ad/newad', {
                    title: req.app.locals.i18n('editAd'),
                    imageArray: arr,
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
        res.redirect('back');
        return;
    }

    if (req.files.image0.name != '' || req.files.image1.name != '') {
        var imageArray = photoHandler(req.files);

        if (imageArray === false) {
            req.flash('info', req.app.locals.i18n('incorrectImage'));
            res.redirect('back');
            return;
        }
    }

    var adCol = req.db.get('ads'),
        colObject = {
            user_id: new ObjectId(req.session.user_id),
            category_id: new ObjectId(req.body.category),
            title: req.body.adtitle,
            description: req.body.addescription,
            price: req.body.adprice,
            status: 'inactive'
        };

    if (req.id == undefined) {

        if (imageArray !== undefined) {
            colObject.images = imageArray;
        }
        adCol.insert(colObject);
        res.redirect('/users/profile');
        return;
    }

    if (req.id !== undefined) {

        adCol.findOne({ _id: req.id, user_id: new ObjectId(req.session.user_id) }, function (err, ad) {
            if (err || !ad) { return next(err); }

            var mongoAction = { $set: colObject };

            if (ad.images) {
                var imagesLength = ad.images.length;
                var dbImages = [];
                for (var p = 0; p < 2; p++) {
                    dbImages.push(ad.images.filter(function(obj) {
                        return obj.fieldName == 'image' + p;
                    })[0]);
                }
            }

            if (imageArray) {
                var newImages = [];
                for (var k = 0; k < 2; k++) {
                    newImages.push(imageArray.filter(function(obj) {
                        return obj.fieldName == 'image' + k;
                    })[0]);
                }
            }

            if (!ad.images && imageArray) {
                colObject.images = imageArray;
                adCol.findAndModify({ _id: ad._id }, mongoAction);
                return;
            }

            for (var i = 0; i < 2; i++) {

                if (newImages && newImages[i] !== undefined && dbImages && dbImages[i] !== undefined) {
                    photoRemover(dbImages[i].src);
                    adCol.findAndModify({ _id: ad._id, 'images.fieldName': 'image' + i }, { $set: { 'images.$': newImages[i] }});
                }

                if (req.files[ 'image' + i ].name == '' && dbImages && dbImages[i] !== undefined && req.body[ 'helper' + i ] == 3) {
                    photoRemover(dbImages[i].src);
                    adCol.findAndModify({ _id: ad._id }, { $pull: { images: dbImages[i] }});
                    imagesLength -= 1;
                }

                if (newImages && newImages[i] !== undefined && dbImages && dbImages[i] == undefined && ad.images) {
                    adCol.findAndModify({ _id: ad._id }, { $push: { images: { $each: [newImages[i]], $position: i}}});
                }

                if (imagesLength == 0) {
                    mongoAction.$unset = { images: '' };
                }
            }
            adCol.findAndModify({ _id: ad._id }, mongoAction);
        });
        res.redirect('/users/profile');
    }
};


router.post('/addad', checkAuth, multipartMiddleware, adCallback);

router.post('/:id/adedit', checkAuth, multipartMiddleware, adCallback);

router.delete('/:id', checkAuth, function (req, res, next) {

    var adCol = req.db.get('ads');

    adCol.findOne({ _id: req.id, user_id: new ObjectId(req.session.user_id) }, function (err, doc) {
        if (err || !doc) { return next(err); }

        if (doc.images !== undefined) {

            for (var i = 0; i < doc.images.length; i++) {

                photoRemover(doc.images[i].src);
            }
        }

        adCol.removeById(doc._id, function (err) {
            if (err) { return next(err); }
        });
        res.redirect('/users/profile');
    });
});

module.exports = router;
