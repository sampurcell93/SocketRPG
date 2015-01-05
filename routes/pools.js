var express = require('express');
var router = express.Router();
var pools = require("../lib/pool");
var pass = require("../lib/pass");
var db = require("../lib/db");
var conn = db.connection;
var _ = require("underscore")

/* GET active pools. */
router.get('/', pass.restrict, function(req, res) {
    res.json(pools.getActivePools());
});

// Get pool by identifier and users in pool
router.get("/:identifier")

// Create a new pool with name
// @param req.body.name {String}
router.post("/", pass.restrict, function(req, res) {
    if (_.isUndefined(req.body.name)) {
        res.status(400).json({error: "No room name specified."})
    }
    else {
        pools.Create(req.body.name, 4, {
            success: function(pool) {
                res.status(201).json(pool.toJSON());
            },
            failure: function(err) {
                res.status(500).json(err);
            }
        });
    }
});

// Delete a pool with name
// @param req.body.name {String}
router.delete("/", function(req, res) {
    var id = req.body.id;
    if (_.isUndefined(id)) {
        res.status(400).json({error: "No room name specified."})
    }
    else {
        pools.Remove(id, req.userID || 4, {
            success: function() {
                console.log("sucessful removal of pool " + id + " by " + (req.userID || 4));
                res.status(202)
            },
            failure: function(err) {       
                console.log("failed removal of pool " + id + " by " + (req.userID || 4));
                res.status(500).json(err);
            }
        });
    }
    res.end()
});


module.exports = router;
