var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'GameV2',
  password : ''
});

connection.connect();

module.exports.connection = connection;
