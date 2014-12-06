require.config({
    paths: {
        'jquery'    : 'bower_components/jquery/dist/jquery.min',
        'backbone'  : 'bower_components/backbone/backbone',
        'underscore': 'bower_components/underscore/underscore-min',
        'marionette': 'bower_components/marionette/lib/backbone.marionette.min',
        'easel'     : 'bower_components/easel/easel.min',
        'jqueryui'  : 'bower_components/jqueryui/jquery-ui',
        'socket'    : 'bower_components/socket.io/socket.io.min'
    },
    urlArgs: "bust=" + (new Date()).getTime(),
    config: {
        tiler: {
            tile_dimension: 50
        },
        items: {
            items_url: 'items.json'
        }
    }
})

// Global dependencies
define(['jquery', 'underscore', 'backbone', 'marionette', 'easel', 'hub', 'jqueryui', 'socket'], 
    function($, _, Backbone, Marionette, easel, hub, jqui, io) {
        // User-made modules, in the context of global dependencies
        require(['tiler', 'actor', 'objectrenderer', 'keymapping', 'console', 
            'modifiers', 'items', 'users', 'assetloader', 'mapmaker'], 
            function(tiler, actors, objectrenderer, 
                keymapping, emitter, modifiers, items, users, assetloader, mapmaker) {
                hub.dispatcher.on("loaded:assets", function() {
                    spawner = actors.getSpawner()
                    actor = spawner.spawn()
                    objectrenderer.addObject(actor.marker, 0)
                    actor.moveRight(7)
                    actor.moveDown(4)
                    actors.setCurrentActor(actor);
                    hub.dispatcher.dispatch("load:map", "Home", 0,0)
                })
                var socket = io.connect('http://localhost');
                socket.on('news', function (data) {
                    console.log(data);
                    socket.emit('my other event', { my: 'data' });
                });
            }
        )
    }
)