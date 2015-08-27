var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var fs = require('fs');
var multipart = require('connect-multiparty');
var ObjectId = require('mongodb').ObjectId;
var captchapng = require('captchapng');

var multipartMiddleware = multipart();


router.use(methodOverride(function(req){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


function checkAuth(req, res, next) {
    if (!req.session.user_id) {
        req.flash('info', 'Please log in');
        res.redirect('/users/login');
    } else {
        next();
    }
}

function isUserHasAccessToAd(adId, req) {
    var db = req.db;
    db.get('ads').findById(adId, function(err, doc) {

        if (req.session.user_id == doc.user_id) {
            return true;
        }

    });
    return falrouter.get('/', function(req, res) {
    res.render( 'ad/ads', {
        ads : 0,
        message : req.flash('info')

    });
    });
}

router.get('/newad', checkAuth, function(req, res) {
    var db = req.db;
    var userCol = db.get('users');
    userCol.findById(req.session.user_id, function (err, doc) {
        var newCaptcha = parseInt(Math.random()*9000+1000);
        req.session.captcha = newCaptcha;

        var p = new captchapng(80,30,newCaptcha); // width,height,numeric captcha
        p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
        p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)

        var img = p.getBase64();
        var imgbase64 = new Buffer(img,'base64').toString('base64');
        res.render('ad/newad', {
            curPage:'/ads/newad',
            user: doc,
            ad: {
                title: '',
                description: '',
                price: ''
            },
            formAction: '/ads/addad',
            captcha: imgbase64,
            message : req.flash('info')
        });
    });

});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {

  var db = req.db;
  var adCol = db.get('ads');
  adCol.findById(id, function (err) {
        if (err) {
          res.send(id + ' was not found');
    }
    else {
      req.id = id;
      next();
    }
  })
});


router.get('/:id', function(req, res) {

  var db =req.db;
  var userCol = db.get('users');
  var adCol = db.get('ads');
  var categoryCol = db.get('categories');
  adCol.findById(req.id, function (err, ad) {
      categoryCol.findById(ad.category_id, function(err, category) {
          userCol.findById(ad.user_id, function (err, user) {
              res.render('ad/show', {
                  curPage:'/ads/' + req.id,
                  ad : ad,
                  category : category,
                  message : req.flash('info'),
                  user : user
              });
          });
      });
  });
});


//GET the individual ad by Mongo ID
router.get('/:id/edit', checkAuth, function(req, res) {

  var db =req.db;
  var adCol = db.get('ads');
  var userCol = db.get('users');
  var categoryCol = db.get('categories');
  adCol.findById(req.id, function (err, ad) {
      categoryCol.findById(ad.category_id, function(err, category) {
          userCol.findById(ad.user_id, function (err, user) {
              var newCaptcha = parseInt(Math.random()*9000+1000);
              req.session.captcha = newCaptcha;
              var p = new captchapng(80, 40, newCaptcha); // width,height,numeric captcha
              p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
              p.color(150, 80, 10, 205); // Second color: paint (red, green, blue, alpha)
              var img = p.getBase64();
              imgbase64 = new Buffer(img,'base64').toString('base64');
              res.render('ad/newad', {
                  curPage:'/ads/' + req.id + '/edit',
                  user : user,
                  category : category,
                  ad : ad,
                  formAction: '/ads/' + req.id + '/adedit',
                  captcha: imgbase64,
                  message: req.flash('info')
              });
          });
      });
  });
});


var adCallback = function(req, res) {

    if (req.body.captcha != req.session.captcha) {
        req.flash('info', req.app.locals.i18n('noCaptcha'));
        res.redirect('/ads/newad');
        return;
    }


    var db = req.db;
    var adCol = db.get('ads');
    var colObject = {
        user_id : ObjectId(req.session.user_id),
        title: req.body.adtitle,
        description: req.body.addescription,
        price: req.body.adprice
    };

    if (req.files.photo1.name != '') {

        var origPath = req.files.photo1.path;
        var imageName = Math.random() + req.files.photo1.name;
        var targetPath = './public/images/' + imageName;
        colObject.image1 = imageName;

        fs.rename(origPath, targetPath, function (err) {
            if (err) throw err;
        });

    }

    if (req.files.photo2.name != '') {

        var origPath2 = req.files.photo2.path;
        var imageName2 = Math.random() + req.files.photo2.name;
        var targetPath2 = './public/images/' + imageName2;
        colObject.image2 = imageName2;

        fs.rename(origPath2, targetPath2, function (err) {
            if (err) throw err;
        });
    }


    // updating record

    if (req.id !== undefined) {

        if(isUserHasAccessToAd(req.id, req) === false){
            res.redirect('/');
            return;
        }

        // removing old pictures

        adCol.findById(req.id, checkRights, function (err, doc) {
            if (imageName !== undefined && doc.image1 !== undefined) {
                fs.unlinkSync('./public/images/' + doc.image1);
            }
            if (imageName2 !== undefined && doc.image2 !== undefined) {
                fs.unlinkSync('./public/images/' + doc.image2);
            }
        });


        adCol.findAndModify(checkRights, {_id: req.id}, {$set: colObject}).success(function () {
            res.redirect('/ads/' + req.id);
        });


        // inserting record

    } else {
        db.get('categories').findById(req.body.category, function(err, doc) {

            if (doc) {
                colObject.category_id = ObjectId(req.body.category);
                adCol.insert(colObject).success( function () {
                    res.redirect('/users/profile');
                });
            }
            else {
                req.flash('info', req.app.locals.i18n('noCategory'));
                res.redirect('/ads/newad');
            }
        });
    }
};


router.post('/addad', checkAuth, multipartMiddleware, adCallback);

router.post('/:id/adedit', checkAuth, multipartMiddleware, adCallback);

router.get('/:id/imgdel', checkAuth, function (req, res) {


    var db =req.db;
    var adCol = db.get('ads');
    var imgObject = {};
    adCol.findById(req.id, function (err, doc) {
        if (req.query.img === doc.image1) {
           imgObject.image1 = 1;
        }
        if (req.query.img === doc.image2) {
           imgObject.image2 = 1;
        }
            adCol.findAndModify({_id: req.id}, {$unset: imgObject});

        fs.unlinkSync('./public/images/' + req.query.img);
        res.redirect('/ads/' + req.id + '/edit')

    });
});


router.delete('/:id', checkAuth, function (req, res){

  if(isUserHasAccessToAd(req.id, req) === false){
      res.redirect('/');
        return;
  }

  if (req.body.captcha != req.session.captcha) {
        req.flash('info', req.app.locals.i18n('noCaptcha'));
        res.redirect('/ads/newad');
        return;
  }

  var db =req.db;
  var adCol = db.get('ads');
  adCol.findById(req.id, function (err, doc) {
    if (err) {
      return err;
    }

    if (doc.image1 !== undefined) {
            fs.unlinkSync('./public/images/' + doc.image1);
    }
    if (doc.image2 !== undefined) {
            fs.unlinkSync('./public/images/' + doc.image2);
    }
    adCol.removeById(req.id,function (err) {
        if (err) {
          return err;
        } else {
              res.redirect('/users/profile');
        }
    });

  });
});


module.exports = router;
