var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bravito' });
});









/*router.get('/ads/adlist/:id',function(req,res){
  var db =req.db;
  var collection = db.get('adcollection');
  var userInfo = req.params.id;
  var userInfoName = req.params.Name;
  collection.find({'_id' : userInfo},function(e,docs){
   // res.json(docs);
    res.render('ad', {
      "ad" : docs
    })
  })
});

/*
 * GET adlist.
 */
/*router.get('/ads/adlist', function(req, res) {
  var db = req.db;
  var collection = db.get('adcollection');
  collection.find({},{},function(e,docs){
    res.json(docs);
  });
});
*/


module.exports = router;
