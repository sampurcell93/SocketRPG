var dispatcher = require("./dispatcher");
var io;
dispatcher.on("initialize:general_socket", function(server) {
    io = require('socket.io')(server);
    console.log("init socket")
    var nsp = io.of("/my_namespace");
    nsp.on("connection", function(socket2) {
        console.log("test connection to my_namespace successful")
    })

    io.on('connection', function (socket) {
        dispatcher.dispatch("ready:socket", socket);
    })    
})

module.exports = {}