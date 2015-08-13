var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;



/* GET home page. */
router.get('/', function(req, res) {
      res.render('index', {
          curPage: '/'
      });
});



router.param('id', function (req, res, next, id) {

    var db = req.db;
    var categoryCol = db.get('categories');
    categoryCol.findById(id, function (err) {
        if (err) {
            res.send(id + ' was not found');
        }
        else {
            req.id = id;
            next();
        }
    })
});



router.get('/category/:id', function(req, res) {
    var db =req.db;
    var adCol = db.get('ads');
    var perPage = 4;
    var page = req.query.page || 0;
    adCol.find({ category_id : ObjectId(req.id) },{
        skip: perPage * page,
        limit: perPage,
        sort: { _id: -1 }
    }, function(err, ads) {
        adCol.count({ category_id : ObjectId(req.id) }, function(err, count) {

            var pages = [];
            for (var p = 0; p < count/perPage; p++) {
                pages.push('/category/' + req.id + '?page=' + p);
            }

            res.render('ad/ads', {
                curPage: '/category/' + req.id,
                category: req.id,
                ads: ads,
                pages: pages,
                pageIndex: page,
                message : req.flash('info')
            });
        });
    });
});



router.get('/search', function (req, res) {
    var db =req.db;
    var adCol = db.get('ads');
    var perPage = 4;
    var page = req.query.page || 0;
    var searchText = req.query.search;
    var arrayInput = searchText.split(' ');
    var pattern = arrayInput.map( function(word) {
        return '(' + '?'+ '=' + '.' + '*' + word + ')'
    });
    var regexString = pattern.join('') + '.+';
    var reg = new RegExp(regexString, 'ig');
    adCol.find(
        {
            $or : [
                { title :       { $regex : reg } },
                { description : { $regex : reg } }
            ]
        }, {
            skip: perPage * page,
            limit: perPage,
            sort: { _id: -1 }
        }, function(err, docs) {
            if (docs == 0) {
                req.flash('info', req.app.locals.i18n('noAds'));
                res.redirect('/ads');
            }
            else {
                adCol.count({
                    $or : [
                        { title :       { $regex : reg } },
                        { description : { $regex : reg } }
                    ]
                }, function(err, count) {

                    var pages = [];
                    for (var p = 0; p < count/perPage; p++) {
                        pages.push('/search?page=' + p + '&search=' + searchText);
                    }
                    res.render('ad/ads', {
                        curPage: '/',
                        ads: docs,
                        pages: pages,
                        currentPage: page,
                        message: req.flash('info'),
                        word: searchText
                    });

                });
            }
        }
    );
});


router.get('/locale', function (req, res) {
    req.session.locale = req.query.locale;
    console.log(req.query.current);
    res.redirect(req.query.current);
});

module.exports = router;
