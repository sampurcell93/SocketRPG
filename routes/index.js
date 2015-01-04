var express = require('express');
var router = express.Router();
var pass = require('../lib/pass');

/* GET home page. */
router.get('/', pass.restrict, function(req, res) {
    console.log(req.session)
    res.render('index', { title: 'Express', user: req.session.user });
});

module.exports = router;
