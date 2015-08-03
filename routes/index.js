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
    var adCol = db.get('ads');
    var perPage = 4;
    var page = req.query.page;
    adCol.find({category_id : ObjectId(req.query.id)},{
        skip: perPage * page,
        limit: perPage,
        sort: { '_id': -1}
    }, function(err, docs) {
        adCol.count({category_id : ObjectId(req.query.id)}, function(err, total) {

            var str = '';
            var page1 = 0;
            //var clas = page == 0 ? "active" : "no"
            str += '<li><a href="/category?page=' + page1 + '&id=' + req.query.id + '">First</a></li>'

            for (var p = 0; p < total/perPage; p++) {
            var page2 = p;
            //clas = page == p ? "active" : "no"
            str += '<li><a href="/category?page=' + page2 + '&id=' + req.query.id + '">' + p + '</a></li>'
            }

            var page3 = total/perPage;
            //clas = page == page ? "active" : "no"
            str += '<li><a href="/category?page=' + page3 + '&id=' + req.query.id + '">Last</a></li>'

            console.log(str);
            res.render('ad/ads', {
                ads: docs,
                page: page,
                str: str
            });
        });
    });
});




module.exports = router;
