var express = require('express');
var router = express.Router();

/*jslint sloppy: true*/
/*jslint nomen: true*/

function checkAdmin(req, res, next) {
    if (req.session.isAdmin != true) {
        req.flash('info', 'Please log in');
        res.redirect('/users/login');
    } else {
        next();
    }
}

router.get('/', checkAdmin, function (req, res) {
    var db = req.db,
        adCol = db.get('ads'),
        perPage = 4,
        page = req.query.page || 0,
        p;
    adCol.find({ status: 'inactive' }, {
        skip: perPage * page,
        limit: perPage
    }, function (err, ads) {
        if (err) { throw err; }
        adCol.count({ status: 'inactive' }, function (err, count) {
            if (err) { throw err; }

            var pages = [];
            for (p = 0; p < count / perPage; p++) {
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
                middle: pages.slice(parseInt(page, 10) - 1, parseInt(page, 10)  + 3),
                lastPart: pages.slice(-6),
                last: pages.slice(-1)
            });
        });
    });
});

router.get('/activate', checkAdmin, function (req, res) {
    req.db.get('ads').findAndModify({ _id: req.query.id }, { $set:  { status: 'active'  }});
    res.redirect('/admin');
});

router.get('/main', checkAdmin, function (req, res) {
    req.db.get('ads').findAndModify({ _id: req.query.id }, { $set:  { improvement: 'main'  }});
    res.redirect('/admin');
});

module.exports = router;