var crypto = require('crypto');
var db = require("../lib/db");
var conn = db.connection;
var bcrypt = require("bcrypt");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
/**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
 * Hashes a password with optional `salt`, otherwise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
 * generate a salt for `pass` and invoke `fn(err, salt, hash)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
 *                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
 * @param {String} password to hash                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
 * @param {String} optional salt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
 * @param {Function} callback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
 * @api public                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
 */                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

module.exports.hash = function (pwd, salt) {
    salt = salt || bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(pwd, salt);
    return {
        hash: hash,
        salt: salt
    }
}

module.exports.restrict = function (req, res, next) {
    console.log("checking sesssion")
  if (req.session.user) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    next();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  } else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
    req.session.error = 'Access denied!';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    res.redirect('/login');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
} 


module.exports.authenticate = function(name, pass, fn) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
  if (!module.parent) console.log('authenticating %s:%s', name, pass);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  conn.query("SELECT * from users where username = ? limit 1", name, function(err, rows) {
    if (rows.length > 0) {
        var user = rows[0];
        var hash_salt = module.exports.hash(pass, user.salt)
        var hash = hash_salt.hash;
        var salt = hash_salt.salt;
        if (hash == user.hash) {
            console.log("user " + name + " found :D");
            fn(null, user);
        }
        else {
            fn(new Error('invalid password'));
        }
    }
    else {
        return fn(new Error('cannot find user ' + name));
    }
  })
}    