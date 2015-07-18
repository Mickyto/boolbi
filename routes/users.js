var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});


router.get('/signup/', function(req, res) {
  res.render('signup');
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
  res.render('login');
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
        console.log(req.session.user_id);
        res.redirect('profile');
      } else {
        res.send('Bad username or password');
      }
    }
  });
});



function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.render('default', { msg : 'You are not authorized to view this page'})
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
      res.render('profile', {
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
