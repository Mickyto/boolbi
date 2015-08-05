var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var ObjectId = require('mongodb').ObjectId;

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
  var userCol = db.get('users');
  var rand = Math.random();
  var bodyEmail = req.body.useremail;
  userCol.findOne({ email :  bodyEmail }, function(err, doc) {
    if (doc) {
      req.flash('info', 'That email is already taken');
      res.redirect('/users/signup/');
    } else {
      userCol.insert({
        email: bodyEmail,
        password: req.body.password,
        active : 'no',
        secure_code : rand
      }, function () {
        var link ='http://' + req.get('host') + '/users/emailactivation?random=' + rand + '&email=' + bodyEmail;
        var mailOptions = {
          to: bodyEmail,
          subject: "Please confirm your Email account",
          html: '<head><style>a:hover{border: 2px solid white;}</style></head>' +
          '<body style="background:#247BA7"><div align="center" style="height: 800px; padding: 50px">' +
          '<div style="border: 2px solid green; border-radius: 20px;' +
          'margin-top: 60px; margin-bottom: 60px; background-color: #60AB91;">' +
          '<p align="center" style="font-family: Arial,Helvetica,sans-serif; font-size: 30px; color: gold;">' +
          'Congratulations, you successfully created account on bravito.ru</p>' +
          '<p align="center" style="font-family: Arial,Helvetica,sans-serif; font-size: 15px; color: white;">' +
          'Bravito is a board of free ads where you can find necessary items<br> or services for few minutes<br>' +
          'Now you can compose your own ads to sell items or to tell about your services</p><br>' +
          '<p align="center" style="font-family: Arial,Helvetica,sans-serif; font-size: 20px; color: white;">' +
          'Just one little piece you need:</p><div align="center"><a href=' + link + ' style="font-size: 25px;' +
          ' margin: 20px; background: goldenrod; border-radius: 10px; padding: 10px 40px 10px 40px;' +
          'color: white; text-decoration: none">Click here to confirm your email</a></div>' +
          '<p align="center", style="font-family: Arial,Helvetica,sans-serif;font-size: 30px; color: white;">' +
          'Wish you bargain and successful sales</p></div></div></body>'
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
  var userCol = db.get('users');
    userCol.findOne({ email : req.query.email }, function (err, doc) {
      if (req.query.random == doc.secure_code) {
        userCol.findAndModify({ _id : doc._id }, { $set:  { active : 'yes' }});
        req.session.user_id = doc._id;
        req.session.email = doc.email;
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
  var userCol = db.get('users');
  userCol.findOne({email : req.body.useremail}, function (err, doc) {

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
  var userCol = db.get('users');
  var adCol = db.get('ads');
  var perPage = 4;
  var page = req.query.page;
  userCol.findById(req.session.user_id, function (err, user) {
    adCol.find({ user_id : ObjectId(req.session.user_id) }, {
      skip: perPage * page,
      limit: perPage,
      sort: { _id : -1 }
    }, function(err, ads) {
      adCol.count({ user_id : ObjectId(req.session.user_id) }, function(err, count) {

          var pages = [];
          for (var p = 0; p < count/perPage; p++) {
            pages.push('/users/profile?page=' + p);
          }

          res.render('user/profile', {
            pages: pages,
            user: user,
            myAds: ads
          });
      });
    });
  });
});

router.get('/edit', checkAuth, function (req, res) {
  var db =req.db;
  var userCol = db.get('users');
  userCol.findById(req.session.user_id, function (err, doc) {
    if (err) {
      res.send('No user found.');
    } else {
      res.render('user/edit', {
        user : doc,
        message : req.flash('info')
      });
    }
  })
});


router.post('/edit', checkAuth, function (req, res) {

  if (req.body.newpass1 !== req.body.newpass2) {
    req.flash('info', 'Passwords are not identical');
    res.redirect('/users/edit');
  }
  else {
    var db = req.db;
    var userCol = db.get('users');
    var colObject = {
      name: req.body.name,
      telephone: req.body.telephone
    };

    if (req.body.newpass2 !== '') {
      colObject.password = req.body.newpass2
    }

    userCol.findAndModify({_id: req.session.user_id}, {$set: colObject})
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
