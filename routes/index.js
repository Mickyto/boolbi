var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

/*jslint unparam: true*/
/*jslint sloppy: true*/
/*jslint nomen: true*/

router.get('/', function (req, res) {
    res.render('index', {
        curPage: '/'
    });
});


router.param('id', function (req, res, next, id) {

    req.db.get('categories').findById(id, function (err) {
        if (err) {
            return next(err);
        }
        req.id = id;
        next();
    });
});

function pagination(perPage, count, link) {
    var pageLinks = [],
        p;
    for (p = 0; p < count / perPage; p++) {
        pageLinks.push({
            link: link + p,
            pg: p + 1
        });
    }
    return pageLinks;
}

router.get('/category/:id', function (req, res) {

    var adCol = req.db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        link = '/category/' + req.id + '?page=';
    adCol.find({
        category_id: new ObjectId(req.id),
        status: 'active'
    }, {
        skip: perPage * page,
        limit: perPage,
        sort: {
            _id: -1
        }
    }, function (err, ads) {
        if (err) { throw err; }
        adCol.count({
            category_id: new ObjectId(req.id)
        }, function (err, count) {
            if (err) { throw err; }
            var pages = pagination(perPage, count, link);

            res.render('ad/ads', {
                curPage: '/category/' + req.id,
                category: req.id,
                ads: ads,
                pages: pages,
                pageIndex: page,
                message: req.flash('info'),
                first: pages.slice(0, 1),
                firstPart: pages.slice(0, 6),
                middle: pages.slice(parseInt(page, 10) - 1, parseInt(page, 10)  + 3),
                lastPart: pages.slice(-6),
                last: pages.slice(-1)
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

router.get('/search', function (req, res) {

    var adCol = req.db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        searchText = req.query.search,
        reg = regex(searchText),
        searchIn = {$or: [{ title: { $regex: reg }}, { description: { $regex: reg }}], status: 'active'},
        link = '/search?search=' + searchText + '&page=';
    adCol.find(searchIn, {
        skip: perPage * page,
        limit: perPage,
        sort: {
            _id: -1
        }
    }, function (err, docs) {
        if (err || docs == 0) {
            res.render('default', {
                msg: req.app.locals.i18n('noAds')
            });
        } else {
            adCol.count(searchIn, function (err, count) {
                if (err) { throw err; }
                var pages = pagination(perPage, count, link);

                res.render('ad/ads', {
                    curPage: '/',
                    ads: docs,
                    pages: pages,
                    message: req.flash('info'),
                    word: searchText,
                    pageIndex: page,
                    first: pages.slice(0, 1),
                    firstPart: pages.slice(0, 6),
                    middle: pages.slice(parseInt(page, 10) - 1, parseInt(page, 10)  + 3),
                    lastPart: pages.slice(-6),
                    last: pages.slice(-1)
                });
            });
        }
    });
});


router.get('/locale', function (req, res) {
    req.session.lang = req.query.locale;
    res.redirect(req.query.current);
});

module.exports = router;