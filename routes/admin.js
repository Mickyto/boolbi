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

    /*adCol.col.aggregate([
        //{ $match: { status: 'inactive'}},
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $group: { _id: null, count: { $sum: 1 } } }

        //{ $match: { reason: { $exists: 1 }}},
        //{ $group: { _id: null, count: { $sum: 1 } } },
        //{ $match: { improvement: 'main' }},
        //{ $group: { _id: null, count: { $sum: 1 } } }
        //{ $group: { _id: { status: 'rejected' }, count: { $sum: 1 } } },
        //{ $group: { _id: { improvement: 'main' }, count: { $sum: 1 } } }
        ], function (err, result) {
            console.log(result);
        });*/



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
        page = req.query.page || 0,
        link = '/admin?db=' + req.query.db + '&page=';

    adCol.find(queryCriteria, {
        skip: perPage * page,
        limit: perPage
    }, function (err, ads) {
        if (err) { return next(err); }
        adCol.count(queryCriteria, function (err, count) {
            if (err) { return next(err); }
            var pages = req.pagination(perPage, count, link),
                renderObject = {
                    pages: pages,
                    pageIndex: page,
                    ads: ads,
                    message : req.flash('info'),
                    first: pages.slice(0, 1),
                    firstPart: pages.slice(0, 6),
                    middle: pages.slice(parseInt(page, 10) - 1, parseInt(page, 10)  + 3),
                    lastPart: pages.slice(-6),
                    last: pages.slice(-1)
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

module.exports = router;