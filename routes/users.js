var pass = require('../lib/pass');
var express = require('express');
var router = express.Router();
var db = require("../lib/db");
var conn = db.connection;

function createUser(username, password, done) {
    done = done || function() {}
    var hash_salt = pass.hash(password)
      // store the salt & hash in the "db"
    var user = { 
        username: username,
        hash: hash_salt.hash,
        salt: hash_salt.salt
    }
    var q = conn.query("INSERT INTO users SET ?", user, function(err, result) {
        if (!err) {
            done(true, user);
        }
        else {
            console.log(err);
            done(false);
        }
    });
}

/* Add a new user */
router.post('/', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  conn.query("select count(*) from users where username = ?", username, function(err, rows, cols) {
    var count = rows[0]["count(*)"];
    if (count > 0) {
        console.error("A user with this username already exists in the database.");
        res.redirect("back");
    }
    else {
        createUser(username, password, function(complete, user) {
            if (complete) {
                res.json(user)
            }
            else {
                res.json({error: true});
            }
        });
    }
  })
});

module.exports = router;
