var express = require('express');
var router = express.Router();
var validator = require('validator');

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});


router.get('/signup/', function(req, res) {
  res.render('user/signup');
});


router.post('/signup/', function(req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
  var bodyEmail = req.body.useremail;
  colUser.findOne({ 'email' :  bodyEmail }, function(err, doc) {
    if (doc) {
      res.render('default', { msg : 'That email is already taken.' });
    } else {
      colUser.insert({
        username : req.body.username,
        email: req.body.useremail,
        password: req.body.password
      }, function () {
          res.redirect('/');
        });
    }
  });
});





router.get('/login', function(req, res) {
  res.render('user/login', { message : req.flash('info') });
});

router.post('/login', function (req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
  var bodyEmail = req.body.useremail;
  colUser.findOne({'email' : bodyEmail}, function (err, doc) {
    if (err) {
      res.render('default', { msg : 'No user found.'})
    } else {
      if (req.body.password === doc.password) {
        req.session.user_id = doc.email;
        res.redirect('/users/profile');
      } else {
        req.flash('info', 'Email or password is wrong');
        res.redirect('/users/login');
      }
    }
  });
});



function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    req.flash('info', 'Please log in');
    res.redirect('/users/login');
  } else {
    next();
  }
}


router.get('/profile', checkAuth, function (req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
  colUser.findOne({'email' : req.session.user_id}, function (err, doc) {
    if (err) {
      res.send('No user found.')
    } else {
      res.render('user/profile', {
        user : doc
      });
    }
  });
});

router.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});


module.exports = router;
