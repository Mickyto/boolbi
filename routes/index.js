var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

/*jslint unparam: true*/
/*jslint sloppy: true*/
/*jslint nomen: true*/

router.get('/', function (req, res) {

    var adCol = req.db.get('ads');
    var arr = [];
    adCol.col.aggregate([
        { $group: { _id: '$category_id', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ], function (err, result) {

        for (var p = 0; p < result.length; p++) {
            var categoryKey = result[p]._id;
            var countKey = result[p].count;
            var newObject = {};

            newObject[categoryKey] = countKey;
            arr.push(newObject);
        }

        res.render('index', {
            counts: arr
        });
    });
});


router.get('/about', function (req, res) {
    res.render('about');
});


router.param('id', function (req, res, next, id) {

    req.db.get('categories').findById(id, function (err, doc) {
        if (err || !doc) {
            res.redirect('/');
        }
        req.id = id;
        next();
    });
});


router.get('/category/:id', function (req, res, next) {

    var adCol = req.db.get('ads'),
        perPage = 10,
        pageNumber = req.query.page || 0,
        link = '/category/' + req.id + '?page=';

    adCol.find({
        category_id: new ObjectId(req.id),
        status: 'active'
    }, {
        skip: perPage * pageNumber,
        limit: perPage,
        sort: { _id: -1 }
    }, function (err, ads) {
        if (err) { return next(err); }

        adCol.count({
            category_id: new ObjectId(req.id)
        }, function (err, count) {
            if (err) { return next(err); }

            var pages = req.pagination(pageNumber, perPage, count, link);

            res.render('ad/ads', {
                category: req.id,
                ads: ads,
                pageNumber: pageNumber,
                message: req.flash('info'),
                pageParts: pages
            });
        });
    });
});

function regex(searchText) {

    var arrayInput = searchText.split(' '),
        pattern = arrayInput.map(function (word) {
            return '(?=.*' + word + ')';
        }),
        regexString = pattern.join('') + '.+';

    return new RegExp(regexString, 'ig');
}

router.get('/search', function (req, res, next) {

    var adCol = req.db.get('ads'),
        perPage = 10,
        pageNumber = req.query.page || 0,
        searchText = req.query.search,
        reg = regex(searchText),
        searchIn = {$or: [{ title: { $regex: reg }}, { description: { $regex: reg }}], status: 'active'},
        link = '/search?search=' + searchText + '&page=';

    adCol.find(searchIn, {
        skip: perPage * pageNumber,
        limit: perPage,
        sort: { _id: -1 }
    }, function (err, docs) {
        if (err) { return next(err); }

        if (docs == 0) {
            res.render('default', {
                msg: req.app.locals.i18n('noAds')
            });
        } else {
            adCol.count(searchIn, function (err, count) {
                if (err) { return next(err); }

                var pages = req.pagination(pageNumber, perPage, count, link);

                res.render('ad/ads', {
                    ads: docs,
                    message: req.flash('info'),
                    word: searchText,
                    pageNumber: pageNumber,
                    pageParts: pages
                });
            });
        }
    });
});


router.get('/locale', function (req, res) {
    req.session.lang = req.query.locale;
    res.redirect('back');
});

module.exports = router;