var pass = require('../lib/pass');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    console.log(req.session)
    res.render('login', { title: 'Login', user: req.session.user  || {} });
});

router.post("/", function(req, res) {
    pass.authenticate(req.body.username, req.body.password, function(err, user){                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
        if (user) {        
          // Regenerate session when signing in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
          // to prevent fixation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
          req.session.regenerate(function(){
            // Store the user's primary key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
            // in the session store to be retrieved,
            // or in this case the entire user object
            req.session.user = user;
            req.session.success = true
            res.redirect('/');
          });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
        } else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
          req.session.error = true
          res.redirect('login');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
  });                       
})

module.exports = router;
