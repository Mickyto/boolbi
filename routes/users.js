var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get('/newuser', function(req, res) {
  res.render('signup', {
    'userFormAction': '/users/adduser'
  });
});


router.post('/adduser', function(req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
  var bodyEmail = req.body.useremail;
  colUser.findOne({ 'email' :  bodyEmail }, function(err, user) {
    if (err)
      return done(err);
    if (user) {
      res.send ('That email is already taken.');
    } else {
      colUser.insert({
        email: req.body.useremail,
        password: req.body.password
      }, function (err) {
        if (err) {
          res.send('There was a problem adding the information to the database.');
        } else {
          res.redirect('/');
        }
      });
    }
  });
});





router.get('/log', function(req, res) {
  res.render('signup', {
    'userFormAction': '/users/login'
  });
});

router.post('/login', function (req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
  var bodyEmail = req.body.useremail;
  colUser.findOne({'email' : bodyEmail}, function (err, doc) {
    if (err) {
      res.send('No user found.')
    } else {
      if (req.body.password === doc.password) {
        req.session.user_id = doc._id;
        res.redirect('/users/profile');
      } else {
        res.send('Bad username or password');
      }
    }
  });
});



function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.send('You are not authorized to view this page');
  } else {
    next();
  }
}


router.get('/profile', checkAuth, function (req, res) {
  res.send('if you are viewing this page it means you are logged in');

});

router.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});


module.exports = router;
