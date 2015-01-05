var _ = require("underscore");
var pass = require('../lib/pass');
var express = require('express');
var router = express.Router();
var db = require("../lib/db");
var conn = db.connection;
var dispatcher = require("../lib/dispatcher");
var user = require("../lib/user");
var io, connected = false;

function bindUserSocketHandlers(socket) {
    socket.on("add:online_player", function(playerID) {
        console.log("setting user online in users.js. Player id = " + playerID);
        conn.query("update users set is_online = true where id = " + playerID)
    });
    socket.on("remove:online_player", function(playerID) {
        console.log("setting user online in users.js. Player id = " + playerID);
        conn.query("update users set is_online = true where id = " + playerID)
    })
}

dispatcher.on("ready:socket", function(socket) {
    connected = true;
    bindUserSocketHandlers(socket);
    // console.log("connected")
    // socket.emit('news', { hello: 'world' });
    // socket.on('my other event', function (data) {
    //     console.log(data);
    // });

})

router.get("/:id", function(req, res) {
    var id = req.param("id");
    if (_.isUndefined(id)) {
        res.status(400).json({error: "You need to specify an ID."})
    }
    else {
        user.Get(4, {
            success: function(guy) {
                console.log("found", guy);
            }
        })
    }

})

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
        user.Create(username, password, function(complete, user) {
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
