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

var rand,mailOptions,link,bodyEmail;

router.post('/signup/', function(req, res) {
  var db = req.db;
  var colUser = db.get('usercollection');
  bodyEmail = req.body.useremail;
  colUser.findOne({ 'email' :  bodyEmail }, function(err, doc) {
    if (doc) {
      req.flash('info', 'That email is already taken');
      res.redirect('/users/signup/');
    } else {
      colUser.insert({
        email: bodyEmail,
        password: req.body.password
      }, function () {
        rand = Math.random();
        link = "http://" + req.get('host') + "/users/verify?id=" + rand;
        mailOptions = {
          to: bodyEmail,
          subject: "Please confirm your Email account",
          html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
        };
        transporter.sendMail(mailOptions, function (err, res) {
          if (err) {
            res.end("error");
          }
        });
        res.render('default', { msg : 'Check your Email' });

      });
    }
  });
});

router.get('/verify', function (req, res) {
    if(req.query.id == rand) {
      req.session.user_id = bodyEmail;
      res.redirect('/users/profile');
    } else {
      res.render('default', { msg : 'Bad request' });
    }
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
  var bodyEmail = req.body.useremail;
  colUser.findOne({email : bodyEmail}, function (err, doc) {

    if (doc && req.body.password === doc.password) {
      req.session.user_id = doc.email;
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
  colUser.findOne({'email' : req.session.user_id}, function (err, doc) {
    if (err) {
      res.send('No user found.');
    } else {

      res.render('user/profile', {
        user : doc
      });
    }
  });
});

router.get('/edit', checkAuth, function (req, res) {
  var db =req.db;
  var colUser = db.get('usercollection');
  colUser.findOne({'email' : req.session.user_id}, function (err, doc) {
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
    if (req.body.newpass2 == '') {
      colObject.password = req.body.oldpass
    } else {
      colObject.password = req.body.newpass2
    }

  colUser.findAndModify({email: req.session.user_id}, {$set: colObject})
      .success(function () {
        res.redirect('/users/profile');
  })
});





router.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});


module.exports = router;
