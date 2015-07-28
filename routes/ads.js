var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var fs = require('fs');
var multipart = require('connect-multiparty');


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


router.get('/newad', checkAuth, function(req, res) {
    var db = req.db;
    var colUser = db.get('users');
    var colCateg = db.get('categories');
    colCateg.find({}, function(err, docs) {
        colUser.findById(req.session.user_id, function (err, doc) {
            res.render('ad/newad', {
                categories : docs,
                user: doc,
                ad: {
                    title: '',
                    description: '',
                    price: ''
                },
                formAction: '/ads/addad'
            });
        });
    });
});


router.get('/', function(req, res) {
    var db =req.db;
    var colAds = db.get('ads');
    colAds.find( {}, {sort:{_id : -1 } }, function(err, docs) {
        res.render( 'ad/ads', {
          ads : docs
    });
  });
});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {

  var db = req.db;
  var colAds = db.get('ads');
  colAds.findById(id, function (err) {
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
  var colUser = db.get('users');
  var colAds = db.get('ads');
  colAds.findById(req.id, function (err, ad) {
      colUser.findById(ad.user_id, function (err, user) {
          res.render('ad/show', {
              ad : ad,
              user : user
          });
      })
  })
});


//GET the individual ad by Mongo ID
router.get('/:id/edit', checkAuth, function(req, res) {

  var db =req.db;
  var colAds = db.get('ads');
  var colUser = db.get('users');
  colAds.findById(req.id, function (err, ad) {
      colUser.findById(ad.user_id, function (err, user) {
          res.render('ad/newad', {
              user: user,
              ad: ad,
              formAction: '/ads/' + req.id + '/adedit'
          });
      });
  });
});


var adCallback = function(req, res) {


    var db = req.db;
    var colAds = db.get('ads');
    var colObject = {
        user_id : req.session.user_id,
        category_id : req.body.category,
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

        // removing old pictures

        colAds.findById(req.id, function (err, doc) {
            if (imageName !== undefined && doc.image1 !== undefined) {
                fs.unlinkSync('./public/images/' + doc.image1);
            }
            if (imageName2 !== undefined && doc.image2 !== undefined) {
                fs.unlinkSync('./public/images/' + doc.image2);
            }
        });


        colAds.findAndModify({_id: req.id}, {$set: colObject})
        .success(function () {
            res.redirect('/ads/' + req.id);
        });


        // inserting record

    } else {
        colAds.insert( colObject ).success( function () {
            res.redirect('/ads');
        });
    }
};


router.post('/addad', checkAuth, multipartMiddleware, adCallback);

router.post('/:id/adedit', checkAuth, multipartMiddleware, adCallback);

router.get('/:id/imgdel', function (req, res) {


    var db =req.db;
    var colAds = db.get('ads');
    var imgObject = {};
    colAds.findById(req.id, function (err, doc) {
        if (req.query.img === doc.image1) {
           imgObject.image1 = 1;
        }
        if (req.query.img === doc.image2) {
           imgObject.image2 = 1;
        }
            colAds.findAndModify({_id: req.id}, {$unset: imgObject});

        fs.unlinkSync('./public/images/' + req.query.img);
        res.redirect('/ads/' + req.id + '/edit')

    });
});


router.post('/search', function (req, res) {
    var searchText = req.body.search;
    var arrayInput = searchText.split(' ');
    var pattern = arrayInput.map( function(word) {
        return '(' + '?'+ '=' + '.' + '*' + word + ')'
    });
    var regexString = pattern.join('') + '.+';
    var reg = new RegExp(regexString, 'ig');
    req.db.get('ads').find(
        {
            $or : [
                    { title :       { $regex : reg } },
                    { description : { $regex : reg } }
                  ]
        }, function(err, docs) {
            res.render('ad/ads', {
                ads : docs
            });
        }
    );
});


router.delete('/:id/edit', checkAuth, function (req, res){

  var db =req.db;
  var colAds = db.get('ads');
  colAds.findById(req.id, function (err, doc) {
    if (err) {
      return err;
    } else {
        if (doc.image1 !== undefined) {
            fs.unlinkSync('./public/images/' + doc.image1);
        }
        if (doc.image2 !== undefined) {
            fs.unlinkSync('./public/images/' + doc.image2);
        }
      colAds.removeById(req.id,function (err) {
        if (err) {
          return err;
        } else {
              res.redirect('/ads');
         }
       });
     }
  });
});


module.exports = router;
