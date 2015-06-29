var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

router.use(bodyParser.urlencoded({ extended: true }))

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
  res.render('newad', { title: 'New ad' })
})


/* GET Add ad page. */
router.post('/addad', function(req, res) {
  var db = req.db;
  var userName = req.body.username;
  var userEmail = req.body.useremail;
  var userTelephone = req.body.usertelephone;
  var adTitle = req.body.adtitle;
  var adDescription = req.body.addescription;
  var adPrice = req.body.adprice;
  var collection = db.get('adcollection');
  collection.insert({
    name : userName,
    email : userEmail,
    telephone : userTelephone,
    title : adTitle,
    description : adDescription,
    price : adPrice
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
router.put('/:id/adedit', function(req, res) {
    var db = req.db;
    var userName = req.body.username;
    var userEmail = req.body.useremail;
    var userTelephone = req.body.usertelephone;
    var adTitle = req.body.adtitle;
    var adDescription = req.body.addescription;
    var adPrice = req.body.adprice;
    var collection = db.get('adcollection');
    collection.findById(req.id, function (err, doc) {
      collection.updateById(req.id.toString(), {
          name : userName,
          email : userEmail,
          telephone : userTelephone,
          title : adTitle,
          description : adDescription,
          price : adPrice
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
