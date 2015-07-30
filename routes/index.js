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

router.get('/category', function(req, res) {
    var db =req.db;
    db.get('ads').find({category_id : ObjectId(req.query.id)}, function(err, docs) {
        res.render('ad/ads', {
            ads : docs
        });
    });
});




module.exports = router;
