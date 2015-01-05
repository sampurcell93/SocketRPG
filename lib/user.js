/*
    By Sam Purcell
    User functions, getters, setters, etc
*/
var _ = require("underscore");
var db = require("./db");
var conn = db.connection;
var Backbone = require("backbone");
var dispatcher = require("./dispatcher");
var crypto = require("crypto");
var connected = false;
var pass = require("./pass");
var socketFactory = require("./socketFactory");


var User = Backbone.Model.extend({
    fetch: function(opts) {
        opts = _.extend({
            success: function() {},
            failure: function() {},
            always: function() {}
        }, opts);
        var that = this;
        conn.query("SELECT * from `users` where id = ?", this.id, function(err, rows) {
            var user = rows[0];

            if (!err && _.isUndefined(user)) {
                opts.failure({error: "No user found with that ID"});
            }
            else {
                if (!opts.full) {
                    user = _.pick(user, "username", "created_at", "in_pool", "is_active", "is_online");
                }
                that.attributes = user;
                that.id = user.id;
                if (err) {
                    opts.failure(err);
                }
                else {
                    opts.success(that)
                }
            }
            opts.always(that);
        })
    },
    save: function(opts) {
        var that = this;
        conn.query("UPDATE `users` SET `in_pool` = ? WHERE id = ?", [this.get("in_pool"), this.id], function(err, rows) {
            console.log("updated user pool to " + that.get("in_pool"));
        })
    }
})  

var Users = Backbone.Collection.extend({
    model: User
})

function createUser(username, password, done) {
    done = done || function() {}
    var hash_salt = pass.hash(password)
      // store the salt & hash in the "db"
    var user = { 
        username: username,
        hash: hash_salt.hash,
        salt: hash_salt.salt,
        created_at: new Date()
    }
    conn.query("INSERT INTO users SET ?", user, function(err, result) {
        if (!err) {
            done(true, user);
        }
        else {
            console.log(err);
            done(false);
        }
    });
}

function getUser(id, opts) {
    var user = new User({id: id});
    user.fetch(opts)
}

module.exports = {
    Create: function(username, password, done) {
        createUser.apply(this, arguments);
    },
    Get: function(id, opts) {
        getUser.apply(this, arguments);
    },
    Users: Users
}