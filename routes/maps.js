var express = require('express');
var router = express.Router();
var fs = require("fs");
var _ = require("underscore")
var publicDir = __dirname + "/../public/";

router.post('/:nameString/:blockIndex', function(req, res) {
    try {
        var collection = JSON.stringify(req.body, null, 4);
        fs.writeFileSync(publicDir + "maps/" + req.params.nameString + "/" + req.params.blockIndex + ".tile", collection)
        res.json(200, {success: true});
    }
    catch(e) {
        console.error("something went wrong when saving a map", e)
        res.json(500, {error: 'Something went wrong.'})
    }

});

router.get("/categories", function(req, res) {
    var categories = fs.readdirSync(publicDir + "../public/maps")
    res.json(categories);
})

// Likely a useless route
router.get("/categories/:id", function(req, res) {
    var tiles = fs.readdirSync(publicDir + "../public/maps/" + req.params.id)
    res.json(_.filter(tiles, function(val) { return val.indexOf(".tile") == -1 && val.indexOf(".") !== 0}))
})

module.exports = router;
