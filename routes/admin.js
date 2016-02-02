var express = require('express');
var router = express.Router();

/*jslint sloppy: true*/
/*jslint nomen: true*/

function checkAdmin(req, res, next) {

    if (req.session.isAdmin != true) {
        req.flash('info', 'Please log in');
        res.redirect('/users/login');
    } else {
        next();
    }
}

function adCount(req, res, renderObject, callback) {

    var arrayCount = {},
        adCol = req.db.get('ads');

    adCol.count({}, function (err, all) {
        arrayCount.all = all;

        adCol.count({ status: 'inactive' }, function (err, inactive) {
            arrayCount.inactive = inactive;

            adCol.count({ reason: { $exists: 1 }}, function (err, rejected) {
                arrayCount.rejected = rejected;

                adCol.count({ improvement: 'main' }, function (err, improved) {
                    arrayCount.improved = improved;
                    renderObject.count = arrayCount;
                    callback(res, renderObject);
                });
            });
        });
    });
}


router.get('/', checkAdmin, function (req, res, next) {

    var db = req.db,
        adCol = db.get('ads'),
        perPage = 10,
        queryCriteria = req.query.criteria || {},
        pageNumber = req.query.page || 0,
        link = '/admin?db=' + req.query.db + '&page=';

    adCol.find(queryCriteria, {
        skip: perPage * pageNumber,
        limit: perPage
    }, function (err, ads) {
        if (err) { return next(err); }
        adCol.count(queryCriteria, function (err, count) {
            if (err) { return next(err); }
            var pages = req.pagination(pageNumber, perPage, count, link),
                renderObject = {
                    title: 'Admin panel',
                    pageNumber: pageNumber,
                    ads: ads,
                    message : req.flash('info'),
                    pageParts: pages
                };
            adCount(req, res, renderObject, function (res, renderObject) {
                res.render('admin/admin', renderObject);
            });
        });
    });
});

router.get('/activate', checkAdmin, function (req, res) {

    req.db.get('ads').findAndModify({ _id: req.query.id },
        { $set:  { status: 'active' }, $unset: { reason: '' }});
    res.redirect('back');
});


router.post('/reject', checkAdmin, function (req, res) {

    req.db.get('ads').findAndModify({ _id: req.body.id },
        { $set:  { status: 'inactive', reason: req.body.reason }});
    res.redirect('back');
});

router.get('/main', checkAdmin, function (req, res, next) {

    var action = req.query.action === 'on'
        ? { $set:  { improvement: 'main'  }}
        : { $unset:  { improvement: 'main'  }},
        adCol = req.db.get('ads');

    adCol.findById(req.query.id, function (err, doc) {
        if (err) { return next(err); }

        if (doc.status == 'inactive') {
            req.flash('info', 'At first you must activate the ad');
            res.redirect('back');
            return;
        }

        adCol.findAndModify({ _id: doc._id }, action);
        res.redirect('back');
    });
});


router.get('/magic', checkAdmin, function (req, res, next) {

    var adCol = req.db.get('ads');

    adCol.find({ date: { $exists: false }}, function (err, docs) {
        if (err) { return next(err); }

        for (var i in docs) {

            adCol.findAndModify({ _id: docs[i]._id }, { $set: { date: new Date() }});
            //adCol.findAndModify({ image1: docs[i].image1 }, { $unset: { image1: docs[i].image1 }});

        }
    });

    req.flash('info', 'All magic have been done!');
    res.redirect('back');
});


module.exports = router;

