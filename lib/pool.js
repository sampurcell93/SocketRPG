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
var user = require("./user");

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
            created_at: new Date(),
            players: new user.Users()
        }
    },
    initialize: function() {
        var that = this;
        var nspace = socketFactory.getNamespace(this.get("hashid"));
        nspace.on("connection", function(socket2) {
            // console.log("test connection to " + that.get("hashid") + " for " + that.get("name") + " successful")
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
    },
    removePlayer: function(playerID, opts) {
        var that = this;
        user.Get(playerID, {
            full: true,
            success: function(u) {
                var currentMembers = that.get("current_members");
                if (currentMembers === 0) {
                    opts.failure({error: "There is no one to remove from the pool."})
                }
                else {
                    u.set("in_pool", null);
                    u.save();
                    conn.query("UPDATE `pools` SET `current_members` = ? WHERE `id` = ?",
                        [currentMembers - 1, that.id], function(err, rows) {
                            if (!err) {
                                opts.success(rows[0]);
                            }
                            else {  
                                opts.failure(err);
                            }
                            opts.always(that, u, err);
                     })
                }
            }
        });
    },
    addPlayer: function(playerID, opts) {
        var that = this;
        user.Get(playerID, {
            full: true,
            success: function(u) {
                console.log(u)
                if (that.get("current_members") >= that.get("capacity")) {
                    opts.failure({error: "The pool is full, sorry."})
                }
                else if (u.get("in_pool") !== null) {
                    opts.failure({error: "The user cannot be added to a new pool,\
                     because they are already in a pool. Leave the current pool before you can join a new one."})
                }
                else {
                    that.get("players").add(u);
                    u.set("in_pool", that.id);
                    u.save()
                    conn.query("UPDATE `pools` SET `current_members` = ? WHERE id = ?", 
                        [that.get("current_members") + 1, that.id], function(err, rows) {
                        if (!err) {
                            that.set("current_members", that.get("current_members") + 1);
                            opts.success(that, u);
                        }
                        else {
                            opts.failure(err, u);
                        }
                        opts.always(that, u, err);
                    });
                }
            }
        });
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

function getPool(poolID) {
    return allPools._byId[poolID];
}

function createPool(poolID, createdBy, opts) {
    var pool = new Pool({name: poolID, created_by: createdBy}, {parse: true})
    return pool.save(opts);
}

function removePool(poolID, playerID, opts) {
    allPools.removeFromDB(poolID, playerID, opts);
}

function addPlayerToPool(poolID, playerID, opts) {
    opts = _.extend({
        success: function() {},
        failure: function() {},
        always: function() {}
    }, opts);
    var poolToAddTo = allPools._byId[poolID];

    if (_.isUndefined(poolToAddTo)) {
        opts.failure({error: "No pool can be found with ID" + poolID + "."});
    }
    else {
        poolToAddTo.addPlayer(playerID, opts);
    }
}

function removePlayerFromPool(poolID, playerID, opts) {
    opts = _.extend({
        success: function() {},
        failure: function() {},
        always: function() {}
    }, opts);
    var poolToRemoveFrom = allPools._byId[poolID];

    if (_.isUndefined(poolToRemoveFrom)) {
        opts.failure({error: "No pool can be found with ID" + poolID + "."});
    }
    else {
        poolToRemoveFrom.removePlayer(playerID, opts);
    }
}

module.exports = {
    // Creates a new empty pool referenced by a string ID
    // @param poolID {String|Int}
    // @param createdBy {String|Int}
    // @param opts {Object}
    Create: function(poolID, createdBy, opts) {
        createPool.apply(this, arguments);
    },
    // Removes a pool referenced by poolId
    // @param poolID {String|Int}
    // @param playerId {String|Int}
    // @param opts {Object}
    Remove: function(poolID, playerID, opts) {
        removePool.apply(this,arguments);
    },
    // Add a player to an existing pool.
    // Returns pool if pool does not exist
    // @param poolID {String|Int}
    // @param playerId {String|Int}
    // @param opts {Object}
    addPlayerToPool: function(poolID, playerID, opts) {
        addPlayerToPool.apply(this, arguments);
    },
    // Remove a player from the pool that they are in
    // @param poolID {String|Int}
    // @param playerId {String|Int}
    // @param opts {Object}
    removePlayerFromPool: function(poolID, playerID, opts) {
        removePlayerFromPool.apply(this, arguments);
    },
    getActivePools: function() {
        return allPools.slice(0,10);
    }
}