var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

/*jslint unparam: true*/
/*jslint sloppy: true*/
/*jslint nomen: true*/

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {
        curPage: '/'
    });
});



router.param('id', function (req, res, next, id) {

    var db = req.db,
        categoryCol = db.get('categories');
    categoryCol.findById(id, function (err) {
        if (err) {
            res.send(id + ' was not found');
        } else {
            req.id = id;
            next();
        }
    });
});



router.get('/category/:id', function (req, res) {
    var db = req.db,
        adCol = db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        pages = [],
        p;
    adCol.find({
        category_id: new ObjectId(req.id)
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

            for (p = 0; p < count / perPage; p++) {
                pages.push({

                    link: '/category/' + req.id + '?page=' + p,
                    pg: p + 1

                });
            }

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



router.get('/search', function (req, res) {
    var db = req.db,
        adCol = db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        searchText = req.query.search,
        arrayInput = searchText.split(' '),
        pattern = arrayInput.map(function (word) {
            return '(' + '?' + '=' + '.' + '*' + word + ')';
        }),
        regexString = pattern.join('') + '.+',
        reg = new RegExp(regexString, 'ig'),
        p;
    adCol.find({
        $or: [{
            title: {
                $regex: reg
            }
        }, {
            description: {
                $regex: reg
            }
        }]
    }, {
        skip: perPage * page,
        limit: perPage,
        sort: {
            _id: -1
        }
    }, function (err, docs) {
        if (err) { throw err; }
        if (docs == 0) {
            req.flash('info', req.app.locals.i18n('noAds'));
            res.redirect('/ads');
        } else {
            adCol.count({
                $or: [{
                    title: {
                        $regex: reg
                    }
                }, {
                    description: {
                        $regex: reg
                    }
                }]
            }, function (err, count) {
                if (err) { throw err; }
                var pages = [];

                for (p = 0; p < count / perPage; p++) {
                    pages.push({

                        link: '/search?page=' + p + '&search=' + searchText,
                        pg: p + 1

                    });
                }

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