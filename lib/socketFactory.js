var dispatcher = require("./dispatcher");
var io;
dispatcher.on("initialize:general_socket", function(server) {
    io = require('socket.io')(server);
    console.log("init socket")
    // io.on('connection', function (socket) {
        // dispatcher.dispatch("ready:socket", socket);
    // })    
})

module.exports = {
    getNamespace: function(ns) {
        return io.of("/" + ns);
    }
}