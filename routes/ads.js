var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var fs = require('fs');
var multipart = require('connect-multiparty');


var multipartMiddleware = multipart();


router.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


router.get('/newad', function(req, res) {
  res.render('edit', {
      'ad':
      {   name : '',
          email : '',
          telephone : '',
          title : '',
          description : '',
          price : ''
      },
      'formAction' : '/ads/addad'
  });
});


router.get('/', function(req, res) {

  var db =req.db;
  var colAds = db.get('adcollection');
  colAds.find({},{},function(e, docs){
    res.render('ads', {
      'ads' : docs
    })
  })
});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {

  var db = req.db;
  var colAds = db.get('adcollection');
  colAds.findById(id, function (err) {
        if (err) {
          res.send(id + ' was not found');
    }
    else {
      req.id = id;
      next();
    }
  })
})


router.get('/:id', function(req, res) {

  var db =req.db;
  var colAds = db.get('adcollection');
  colAds.findById(req.id, function (err, doc) {
    if (err) {
    } else {
          res.render('show', {
            'ad': doc
          })
       }
    })
})


//GET the individual ad by Mongo ID
router.get('/:id/edit', function(req, res) {

  var db =req.db;
  var colAds = db.get('adcollection');
  colAds.findById(req.id, function (err, doc) {
    if (err) {
    } else {
      res.render('edit', {
        'ad' : doc,
        'formAction' : '/ads/' + req.id + '/adedit'
      })
    }
  })
})


var adCallback = function(req, res) {


    var db = req.db;
    var colAds = db.get('adcollection');
    var colObject = {
        name: req.body.username,
        email: req.body.useremail,
        telephone: req.body.usertelephone,
        title: req.body.adtitle,
        description: req.body.addescription,
        price: req.body.adprice
    };

    if (req.files.photo1.name != '') {

        var origPath = req.files.photo1.path;
        var imageName = Math.random() + req.files.photo1.name;
        var targetPath = './public/images/' + imageName;
        colObject.mainphoto = imageName;

        fs.rename(origPath, targetPath, function (err) {
            if (err) throw err;
        });

    }

    if (req.files.photo2.name != '') {

        var origPath2 = req.files.photo2.path;
        var imageName2 = Math.random() + req.files.photo2.name;
        var targetPath2 = './public/images/' + imageName2;
        colObject.photo1 = imageName2;

        fs.rename(origPath2, targetPath2, function (err) {
            if (err) throw err;
        });
    }


    // updating record

    if (req.id !== undefined) {

        // removing old pictures

        colAds.findById(req.id, function (err, doc) {
            if (imageName !== undefined) {
                fs.unlinkSync('./public/images/' + doc.mainphoto);
            }
            if (imageName2 !== undefined) {
                fs.unlinkSync('./public/images/' + doc.photo1);
            }

        });


        colAds.findAndModify({_id: req.id}, {$set: colObject})
        .success(function () {
            res.redirect('/ads/' + req.id);
        })





        // inserting record

    } else {
        colAds.insert(colObject).success(function () {
                res.redirect('/ads');
        })
    }
};


router.post('/addad', multipartMiddleware, adCallback);

router.post('/:id/adedit', multipartMiddleware, adCallback);

router.delete('/:id/edit', function (req, res){

  var db =req.db;
  var colAds = db.get('adcollection');
  colAds.findById(req.id, function (err, doc) {
    if (err) {
      return err;
    } else {
        if (doc.mainphoto !== undefined) {
            fs.unlinkSync('./public/images/' + doc.mainphoto);
        }
        if (doc.photo1 !== undefined) {
            fs.unlinkSync('./public/images/' + doc.photo1);
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
