var express = require('express');
var router = express.Router();



router.get('/', function (req, res) {
    var db = req.db;
    var adCol = db.get('ads');
    var perPage = 4;
    var page = req.query.page || 0;
    adCol.find({ status: 'inactive' }, {
        skip: perPage * page,
        limit: perPage
    }, function(err, ads) {
        adCol.count({ status: 'inactive' }, function(err, count) {

            var pages = [];
            for (var p = 0; p < count/perPage; p++) {
                pages.push({

                    link: '/admin?page=' + p,
                    pg: p + 1

                });
            }

            res.render('admin/admin', {
                pages: pages,
                pageIndex: page,
                ads: ads,
                first: pages.slice(0, 1),
                firstPart: pages.slice(0, 6),
                middle: pages.slice(page - 1, page * 1 + 3),
                lastPart: pages.slice(-6),
                last: pages.slice(-1)
            });
        });
    });
});


module.exports = router;