var express = require('express');
var router = express.Router();
var fs = require("fs");

router.post('/:nameString/:blockIndex', function(req, res) {
    try {
        var collection = JSON.stringify(req.body, null, 4);
        fs.writeFileSync(__dirname + "/../public/maps/" + req.params.nameString + "/" + req.params.blockIndex + ".tile", collection)
        res.json(200, {success: true});
    }
    catch(e) {
        console.error("something went wrong when saving a map", e)
        res.json(500, {error: 'Something went wrong.'})
    }

});

module.exports = router;
