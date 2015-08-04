var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;

/* GET home page. */
router.get('/', function(req, res) {
  var db =req.db;
  db.get('categories').find({}, function(err, docs) {
      res.render('index', {
        categories : docs
      });
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
    var page = req.query.page;
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
                ads: ads,
                pages: pages,
                message : req.flash('info')
            });
        });
    });
});




module.exports = router;
