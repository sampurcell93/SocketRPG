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
            'modifiers', 'items', 'users', 'assetloader', 'mapmaker', 'mapselector'], 
            function(tiler, actors, objectrenderer, 
                keymapping, emitter, modifiers, items, users, assetloader, mapmaker, mapselector) {

                function initializeGame() {
                    
                    hub.dispatcher.dispatch("load:map", "Home", 0,0, function(tiles) {
                        tiler.setActiveTiles(tiles);
                        tiler.renderTiles()
                        spawner = actors.getSpawner()
                        actor = spawner.spawn()
                        objectrenderer.addObject(actor.marker, 0)
                        actors.setCurrentActor(actor);
                        actor.setCurrentTile(tiles.getTile(11,9), true)
                        spawnerView = actors.getSpawnerView()
                        objectrenderer.addObject(spawnerView.marker, 0)    
                        cells = actor.currentTile.BFS(function(tile, progenitor) {
                            return tile.isPassableByActor(actor, progenitor)
                        }, {diagonal: false})
                        // cells = actor.currentTile.BFS(function(tile) {
                        //     return tile.get("elevation") > 2
                        // }, {diagonal: true})

                        _.each(cells, function(cell) {
                            cell.trigger("highlight", "red")
                        });
                    })
                    
                }

                hub.dispatcher.on("loaded:assets", initializeGame)
                // var socket = io.connect('http://localhost');
                // socket.on('news', function (data) {
                //     console.log(data);
                //     socket.emit('my other event', { my: 'data' });
                // });
            }
        )
    }
)