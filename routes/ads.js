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


/* GET New Ad page. */
router.get('/newad', function(req, res) {
  res.render('newad');
});


/* GET Add ad page.
router.post('/addad', multipartMiddleware, function(req, res) {

    if (req.files.photo1.name != '') {
        var filePath = req.files.photo1.path;
        var imageName = Math.random() + req.files.photo1.name;
        var targetPath = './public/images/' + imageName;
        fs.rename(filePath, targetPath, function (err) {
            if (err) throw err;
        });
    }

    if (req.files.photo2.name != '') {
        var filePath2 = req.files.photo2.path;
        var imageName2 = Math.random() + req.files.photo2.name;
        var targetPath2 = './public/images/' + imageName2;
        fs.rename(filePath2, targetPath2, function (err) {
            if (err) throw err;
        });
    }

  var db = req.db;
  var colAds = db.get('adcollection');
  colAds.insert({
    name : req.body.username,
    email : req.body.useremail,
    telephone : req.body.usertelephone,
    title : req.body.adtitle,
    description : req.body.addescription,
    price : req.body.adprice,
    mainphoto : imageName,
    photo1 : imageName2
  }, function (err, doc) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    }
    else {
      res.redirect('/ads');
    }
  });
});
*/



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
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
          res.render('show', {
            'user': doc
          })
       }
    })
})


//GET the individual ad by Mongo ID
router.get('/:id/edit', function(req, res) {

  var db =req.db;
  var colAds = db.get('adcollection');
  colAds.findById(req.id, function (err, docs) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
      res.render('edit', {
        'user' : docs
      })
    }
  })
})





var adCallback = function(req, res) {

    if (req.files.photo1.name != '') {

        var origPath = req.files.photo1.path;
        var imageName = Math.random() + req.files.photo1.name;
        var targetPath = './public/images/' + imageName;
        fs.rename(origPath, targetPath, function (err) {
            if (err) throw err;
            fs.unlink(origPath, function () {
                if (err) throw err;
            });
        });
    }

    if (req.files.photo2.name != '') {

        var origPath2 = req.files.photo2.path;
        var imageName2 = Math.random() + req.files.photo2.name;
        var targetPath2 = './public/images/' + imageName2;
        fs.rename(origPath2, targetPath2, function (err) {
            if (err) throw err;
            fs.unlink(origPath2, function () {
                if (err) throw err;
            })
        });
    }

    var db = req.db;
    var colAds = db.get('adcollection');
    var updateObject = {
        name: req.body.username,
        email: req.body.useremail,
        telephone: req.body.usertelephone,
        title: req.body.adtitle,
        description: req.body.addescription,
        price: req.body.adprice
    };
        if (imageName !== undefined) {
            updateObject.mainphoto = imageName;
        }
        if (imageName2 !== undefined) {
            updateObject.photo1 = imageName2;
        }
    if (req.body.hiddenField !== undefined) {
        colAds.findAndModify({_id: req.id}, {$set: updateObject})
        .success(function () {
            res.redirect('/ads/' + req.id);
        })
    } else {
        colAds.insert(updateObject).success(function () {
                res.redirect('/ads');
        })
    }
};



//if (hideField != undefined) {
   // var filePath = './public/images/' + doc.mainphoto;
  //  fs.unlinkSync(filePath);





router.post('/addad', multipartMiddleware, adCallback);

//Update an ad by ID
router.post('/:id/adedit', multipartMiddleware, adCallback);


//DELETE a Ad by ID
router.delete('/:id/edit', function (req, res){

  var db =req.db;
  var colAds = db.get('adcollection');
  colAds.findById(req.id, function (err, doc) {
    if (err) {
      return err;
    } else {
        if (doc.mainphoto !== undefined) {
            var filePath1 = './public/images/' + doc.mainphoto;
            fs.unlinkSync(filePath1);
        }
        if (doc.photo1 !== undefined) {
            var filePath2 = './public/images/' + doc.photo1;
            fs.unlinkSync(filePath2);
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
