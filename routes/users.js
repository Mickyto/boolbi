var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'egayigor@gmail.com',
    pass: 'mia910ei'
  }
});

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});


router.get('/signup/', function(req, res) {
  res.render('user/login', {
    message : req.flash('info'),
    formAction : '/users/signup/',
    btnValue : 'Sign up'
  });
});



router.post('/signup/', function(req, res) {
  var db = req.db;
  var colUser = db.get('users');
  var rand = Math.random();
  var bodyEmail = req.body.useremail;
  colUser.findOne({ email :  bodyEmail }, function(err, doc) {
    if (doc) {
      req.flash('info', 'That email is already taken');
      res.redirect('/users/signup/');
    /*} else if (doc.active == 'no') {
      req.flash('info', 'That email was not activated');
      res.redirect('/users/signup/');*/
    } else {
      colUser.insert({
        email: bodyEmail,
        password: req.body.password,
        active : 'no',
        secure_code : rand
      }, function () {
        var link = "http://" + req.get('host') + "/users/emailactivation?random=" + rand + '&email=' + bodyEmail ;
        var mailOptions = {
          to: bodyEmail,
          subject: "Please confirm your Email account",
          html: 'Hello,<br> Please Click on the link to verify your email.<br><a href=' + link + '>Click here to verify</a>'
        };
        transporter.sendMail(mailOptions, function (err, res) {
          if (err) {
            res.render('default', { msg : 'Something was wrong' });
          }
        });
        res.render('default', { msg : 'Check your Email' });

      });
    }
  });
});

router.get('/emailactivation', function (req, res) {
  var db = req.db;
  var colUser = db.get('users');
    colUser.findOne({ email : req.query.email }, function (err, doc) {
      if (req.query.random == doc.secure_code) {
        colUser.findAndModify({ _id : doc._id }, { $set:  { active : 'yes' }});
        req.session.user_id = doc._id;

        res.redirect('/users/profile');
      } else {
        res.render('default', {msg: 'Bad request'});
      }
    });
});




router.get('/login', function(req, res) {
  res.render('user/login', {
    message : req.flash('info'),
    formAction : '/users/login',
    btnValue : 'Log in'
  });
});

router.post('/login', function (req, res) {
  var db = req.db;
  var colUser = db.get('users');
  colUser.findOne({email : req.body.useremail}, function (err, doc) {

    if (doc && req.body.password === doc.password) {
      if (doc.active == 'no') {
        req.flash('info', 'Email wasn\'t activated');
        res.redirect('/users/login');
      } else {
        req.session.user_id = doc._id;
        req.session.email = doc.email;

        res.redirect('/users/profile');
      }
    } else {
      req.flash('info', 'Email or password is wrong');
      res.redirect('/users/login');
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
  var colUser = db.get('users');
  var colAds = db.get('ads');
  colUser.findById(req.session.user_id, function (err, user) {
    colAds.find({user_id : req.session.user_id}, function(err, ads) {
      res.render('user/profile', {
        user : user,
        myAds : ads
      });
    });
  });
});

router.get('/edit', checkAuth, function (req, res) {
  var db =req.db;
  var colUser = db.get('users');
  colUser.findById(req.session.user_id, function (err, doc) {
    if (err) {
      res.send('No user found.');
    } else {
      res.render('user/edit', {
        user : doc,
        message : req.flash('info')
      })
    }
  })
})


router.post('/edit', checkAuth, function (req, res) {

  if (req.body.newpass1 !== req.body.newpass2) {
    req.flash('info', 'Passwords are not identical');
    res.redirect('/users/edit');
  }
  else {
    var db = req.db;
    var colUser = db.get('users');
    var colObject = {
      name: req.body.name,
      telephone: req.body.telephone
    };

    if (req.body.newpass2 !== '') {
      colObject.password = req.body.newpass2
    }

    colUser.findAndModify({_id: req.session.user_id}, {$set: colObject})
        .success(function () {
          res.redirect('/users/profile');
        })
  }
});





router.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});


module.exports = router;
