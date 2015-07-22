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
  var colUser = db.get('usercollection');
  var rand = Math.random();
  var bodyEmail = req.body.useremail;
  colUser.findOne({ email :  bodyEmail }, function(err, doc) {
    if (doc) {
      req.flash('info', 'That email is already taken');
      res.redirect('/users/signup/');
    } else {
      colUser.insert({
        email: bodyEmail,
        password: req.body.password,
        active : 'no',
        rand : rand
      }, function () {
        var link = "http://" + req.get('host') + "/users/verify?id=" + rand + '&verify[email]=' + bodyEmail ;
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
 //TODO check existing doc, but not activated
router.get('/verify', function (req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
    colUser.findOne({ email : req.query.verify.email }, function (err, doc) {
      if (req.query.id == doc.rand) {
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
  var colUser = db.get('usercollection');
  colUser.findOne({email : req.body.useremail}, function (err, doc) {

    if (doc.active == 'no' ) {
      req.flash('info', 'Email wasn\'t activated');
      res.redirect('/users/login');
    } else if (req.body.password === doc.password ) {
      req.session.user_id = doc._id;
      res.redirect('/users/profile');
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
  var colUser = db.get('usercollection');
  var colAds = db.get('adcollection');
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
  var colUser = db.get('usercollection');
  colUser.findById(req.session.user_id, function (err, doc) {
    if (err) {
      res.send('No user found.');
    } else {
      res.render('user/edit', {
        'user' : doc

      })
    }
  })
})


router.post('/edit', checkAuth, function (req, res) {
  var db =req.db;
  var colUser = db.get('usercollection');
  var colObject = {
    name : req.body.name,
    telephone : req.body.telephone
  };
  // TODO: Check 2 passwords identical
  // FIXME:
    if (req.body.newpass2 !== '') {
      colObject.password = req.body.newpass2
    }

  colUser.findAndModify({_id: req.session.user_id}, {$set: colObject})
      .success(function () {
        res.redirect('/users/profile');
  })
});





router.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});


module.exports = router;
