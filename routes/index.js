var express = require('express');
var router = express.Router();

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
    db.get('categories').findById(req.query.id, function(err, doc) {
        console.log(req.query.name)
        if (err) {
            res.render('default', { msg : 'There is no such category' });
        }
        else {
            db.get('ads').find(doc._id, function(err, docs) {
                console.log(doc._id)
                res.render('ad/ads', {
                    ads : docs
                });
            });
        }
    });
});




module.exports = router;
