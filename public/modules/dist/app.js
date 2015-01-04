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

                function initializeGame() {
                    hub.dispatcher.dispatch("load:map", "Home", 0,0, function(block) {
                        block.render()
                        objectrenderer.addObject(block);
                        spawner = actors.getSpawner()
                        actor = spawner.spawn()
                        // actor2 = spawner.spawn()
                        actor3 = spawner.spawn()
                        actor4 = spawner.spawn()
                        // actor5 = spawner.spawn()
                        block.addChild(actor.marker)
                        actor.setCurrentTile(block.tiles.getTile(9,14), true)
                        actors.setCurrentActor(actor);
                        // actor2.setCurrentTile(block.tiles.getTile(13,10), true)
                        actor3.setCurrentTile(block.tiles.getTile(12,10), true)
                        actor4.setCurrentTile(block.tiles.getTile(3,5), true)
                        // actor5.setCurrentTile(block.tiles.getTile(4,11), true)
                        // block.addChild(actor2.marker)
                        block.addChild(actor3.marker)
                        block.addChild(actor4.marker)
                        // block.addChild(actor5.marker)
                        spawnerView = actors.getSpawnerView()
                        block.addChild(spawnerView.marker)    
                    //     debugger
                        cells = actor.currentTile.BFS(function(tile, progenitor) {
                            return tile.isOccupied()
                        }, function(tile, progenitor) {
                            return tile.isPassableByActor(actor, progenitor)
                        }, {diagonal: true, range: 11})
                        _.each(cells, function(cell) {
                            cell.trigger("highlight", "red")
                        });
                    })
                    
                }

                hub.dispatcher.on("loaded:assets", initializeGame)
                var socket = io.connect('http://localhost');
                socket.on('news', function (data) {
                    socket.emit('my other event', { my: 'data' });
                });
            }
        )
    }
)