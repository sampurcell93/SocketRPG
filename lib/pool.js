/*
    By Sam Purcell
    Pooling is a way for players to be grouped together to play 
    rounds of the game together in real time.
    Currently, only two players are allowed per pool (1v1 competition),
    but it should be easy to make games with > 2 players.
*/
var _ = require("underscore");
var db = require("./db");
var conn = db.connection;
var Backbone = require("backbone");
var dispatcher = require("./dispatcher");
var crypto = require("crypto");
var connected = false;
var socketFactory = require("./socketFactory");

function bindPoolSocketHandlers(socket) {
    socket.on("add:free_player", function(player) {
        console.log(player);
    })
}

dispatcher.on("ready:socket", function(socket) {
    connected = true;
    bindPoolSocketHandlers(socket);
    // console.log("connected")
    // socket.emit('news', { hello: 'world' });
    // socket.on('my other event', function (data) {
    //     console.log(data);
        // });

})

var Pool = Backbone.Model.extend({
    defaults: function() {
        return {
            created_at: new Date()
        }
    },
    initialize: function() {
        var that = this;
        var nspace = socketFactory.getNamespace(this.get("hashid"));
        nspace.on("connection", function(socket2) {
            console.log("test connection to " + that.get("hashid") + " for " + that.get("name") + " successful")
        })
    },
    parse: function(response) {
        response.created_at = new Date(response.created_at);
        return response;
    },
    save: function(opts) {
        opts = _.extend({
            success: function() {},
            failure: function() {},
            always: function() {}
        }, opts);
        var that = this;
        var hash = crypto.createHash('md5').update(this.get("name").toString()).digest('hex');
        var pool = {
            name: this.get("name"),
            created_by: this.get("created_by"),
            hashid: hash
        }
        var errorMsg = "The pool named " + that.get("name") + "was not created.";
        conn.query("INSERT INTO pools SET ? ", pool, function(err, rows, cols) {
            if (!err) {
                conn.query("SELECT * FROM `pools` WHERE `name`= ? ORDER BY `created_at` DESC LIMIT 1", that.get("name"),
                 function(err, rows) {
                    pool = rows[0];
                    if (!err & !_.isUndefined(pool)) {
                        _.extend(that.attributes, pool);
                        opts.success.call(that, that);
                    }
                    else {
                        opts.failure.call(that, {error: errorMsg });
                    }
                    opts.always.call(that);
                });
            }
            else {
                opts.failure.call(that, {error: errorMsg});
            }
        })
    }
});

var Pools = Backbone.Collection.extend({
    model: Pool,
    parse: function(response) {
        var that = this;
        _.each(response, function(m, k) {
            response[k] = new Pool(m, {parse: true})
            that.add(response[k]);
        });
        that.sort();
    },
    initialize: function() {
        // var nspace = socketFactory.getNamespace("/poolManager");
        // nspace.on("connection", function(socket2) {
        //     console.log("also connected to pool manager")
        // })
    },
    comparator: function(model) {
        return -model.get("created_at");
    },
    fetch: function(opts) {
        opts = _.extend({
            success: function() {},
            failure: function() {},
            always: function() {}
        }, opts);
        var that = this;
        return conn.query("select * from pools limit 10", function(err, rows) {
            if (err) {
                opts.failure.call(that,err);
            }
            else {
                that.parse(rows);
                opts.success.call(that, rows);
            }
            opts.always.call(that, rows, err);
        });
    },
    // Should definitely go into a validation controller or service of some sort
    removeFromDB: function(toRemove, playerID, opts) {
        opts = _.extend({
            success: function() {},
            failure: function() {},
            always: function() {}
        }, opts);
        var poolToRemove = this._byId[toRemove]
        if (_.isUndefined(poolToRemove)) {
            opts.failure({error: "No pool by that ID was found."})
        }
        else {
            this.remove(toRemove);
            conn.query("delete from pools where id = ? and created_by = ?",
                [toRemove, playerID], function(err, rows) {
                    if (!err && rows.affectedRows > 0) {
                        opts.success()
                    }
                    else if (!err && rows.affectedRows === 0) {
                        opts.failure({error: "No pool by that ID was found."})
                    }
                    else {
                        opts.failure(err);
                    }
                    opts.always(rows, err);
            })
        }
    }
});

function initialize() {
    // Caching layer for pools stored in the `pools` table
    var allPools = new Pools();
    allPools.fetch({
        success: function(rows) {
            // console.log(allPools);
        },
        failure: function(err) {
            console.log(err);
        }
    });
    return allPools;
}

var allPools = initialize();

function createPool(poolID, createdBy, opts) {
    var pool = new Pool({name: poolID, created_by: createdBy}, {parse: true})
    return pool.save(opts);
}

function removePool(poolID, playerID, opts) {
    allPools.removeFromDB(poolID, playerID, opts);
}

module.exports = {
    // Creates a new empty pool referenced by a string ID
    // @param {String}
    Create: function(poolID, createdBy, opts) {
        createPool.apply(this, arguments);
    },
    // Removes a pool referenced by poolId
    // @param {String}
    Remove: function(poolID, playerID, opts) {
        removePool.apply(this,arguments);
    },
    // Add a player to an existing pool.
    // Returns pool if pool does not exist
    // @params {String, String}
    addPlayer: function(playerID, poolID) {

    },
    // Remove a player from the pool that they are in
    // @param {String}
    removePlayer: function(playerID) {

    },
    getActivePools: function() {
        return allPools.slice(0,10);
    }
}