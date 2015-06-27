var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bravito' });
});

/* GET New Ad page. */
router.get('/newad', function(req, res) {
  res.render('newad', { title: 'New ad' })
})

/* GET Add ad page. */
router.post('/addad', function(req, res) {
  var db = req.db;
  var userName = req.body.username;
  var userEmail = req.body.useremail;
  var userTelephone = req.body.usertelephone;
  var adTitle = req.body.adtitle;
  var adDescription = req.body.addescription;
  var adPrice = req.body.adprice;
  var collection = db.get('adcollection');
  collection.insert({
    "Name" : userName,
    "E-mail" : userEmail,
    "Telephone" : userTelephone,
    "Title" : adTitle,
    "Description" : adDescription,
    "Price" : adPrice
      }, function (err, doc) {
    if (err) {
      res.send("There was a problem adding the information to the database.");
     }
    else {
      res.redirect("ads");
    }
  });
});

router.get('/ads', function(req, res) {
  var db =req.db;
  var collection = db.get('adcollection');
  collection.find({},{},function(e,docs){
      res.render('ads', {
        "ads" : docs
      })
  })
});




module.exports = router;
