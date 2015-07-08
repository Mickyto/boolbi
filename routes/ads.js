var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var fs = require('fs');
var multipart = require('connect-multiparty');



router.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))


/* GET New Ad page. */
router.get('/newad', function(req, res) {
  res.render('newad')
})


/* GET Add ad page. */
var multipartMiddleware = multipart();
router.post('/addad', multipartMiddleware, function(req, res) {

  var filePath = req.files.photo1.path;
  var imageName = Math.random() + req.files.photo1.name;
  var targetPath = './public/images/'+imageName;
  fs.rename(filePath, targetPath, function(err) {
  });

  var filePath2 = req.files.photo2.path;
  var imageName2 = Math.random() + req.files.photo2.name;
  var targetPath2 = './public/images/'+imageName2;
  fs.rename(filePath2, targetPath2, function(err) {
  });



  var db = req.db;
  var collection = db.get('adcollection');
  collection.insert({
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


router.get('/', function(req, res) {
  var db =req.db;
  var collection = db.get('adcollection');
  collection.find({},{},function(e, docs){
    res.render('ads', {
      'ads' : docs
    })
  })
});



// route middleware to validate :id
router.param('id', function(req, res, next, id) {
  var db = req.db;
  var collection = db.get('adcollection');
  collection.findById(id, function (err, doc) {
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
  var collection = db.get('adcollection');
  collection.findById(req.id, function (err, doc) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
      console.log(doc);
          res.render('show', {
            'user': doc
          })
       }
    })
})


//GET the individual ad by Mongo ID
router.get('/:id/edit', function(req, res) {
  var db =req.db;
  var collection = db.get('adcollection');
  collection.findById(req.id, function (err, docs) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
          res.render('edit', {
            'user' : docs
          })
        }
  })
})




//PUT to update a ad by ID
router.post('/:id/adedit', multipartMiddleware, function(req, res) {

    var filePath = req.files.photo1.path;
    var imageName = Math.random() + req.files.photo1.name;
    var targetPath = './public/images/' + imageName;
    fs.rename(filePath, targetPath, function(err) {
    });

    var filePath2 = req.files.photo2.path;
    var imageName2 = Math.random() + req.files.photo2.name;
    var targetPath2 = './public/images/' + imageName2;
    fs.rename(filePath2, targetPath2, function(err) {
    });

    var db = req.db;
    var collection = db.get('adcollection');
    collection.findById(req.id, function (err, doc) {
      collection.updateById(req.id.toString(), {
          name : req.body.username,
          email : req.body.useremail,
          telephone : req.body.usertelephone,
          title : req.body.adtitle,
          description : req.body.addescription,
          price : req.body.adprice,
          mainphoto : imageName,
          photo1 : imageName2
        }, function (err, user) {
          if (err) {
            res.send('There was a problem updating the information to the database: ' + err);
          } else {
            res.redirect('/ads/' + req.id.toString());
          }
        })
    })
});



//DELETE a Ad by ID
router.delete('/:id/edit', function (req, res){
  //find Ad by ID
  var db =req.db;
  var collection = db.get('adcollection');
  collection.findById(req.id, function (err, docs) {
     //var filePath = './public/images/' + req.mainphoto.toString();
     //fs.unlinkSync(filePath);
    if (err) {
      return console.error(err);
    } else {

      collection.removeById(req.id,function (err, docs) {
        if (err) {
          return console.error(err);
        } else {
              res.redirect('/ads');
         }
       });
     }
  });
});



module.exports = router;
