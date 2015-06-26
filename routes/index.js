var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET Hello World page. */
router.get('/newad', function(req, res) {
  res.render('newad', { title: 'New Ad' })
});


router.get('/ad', function(req, res) {
  res.render('ad', { title: 'Ad' })
});


module.exports = router;
