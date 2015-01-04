define ['module', 'objectrenderer'], (module, objectrenderer) ->
    dispatcher = hub.dispatcher
    config = module.config();
    # Width in tiles
    _boardWidth = 19
    # Height in tiles
    _boardHeight = 14
    # Board padding in pixels
    _boardMargin = 40
    # TileCache - store tiles in memory
    tileCache = {}
    # root path of all map images
    maproot = "maps/"
    # "global" holding info about the current stahe
    stageInfo = null

    getPathOptions = ->
        # Default path options for BFS
        path_options = # Compute diagonals as a distance-1 move?
            diagonal: false
            # Do not designate squares occupied by NPCs as un-enterable
            ignoreNPCs: false
            # Do not designate squares occupied by PCs as un-enterable
            ignorePCs: false
            # Only designate occupied squares as valid.
            ignoreEmpty: false
            # Should difficult terrain factor into distance?
            ignoreDifficult: false
            # Should the cumulative path be stored in each node that is traversed?
            storePath: true
            # Should the acceptable directions of a square
            ignoreDeltas: false
            # How long should we search for?
            range: 6
            # The context to call the handler in
            handlerContext: @
            # How much elevation is acceptable?
            jump: 2
            # truth test - executes after all other checks (which can be ignored by modifying other opts)
            # If it returns true, the square is returned regardless - if false, the square is not counter.
            truth_test: (target) -> true


    class Tile extends Backbone.Model
        defaults: ->
            return {
                size: config.tile_dimension
                difficulty: 1
                elevation: 0
                passable: true
            }
        initialize: ->
            @occupiedBy = null
        getCellIndices: ->
            if @_rc and @_cc
                return {rowCell: @_rc, colCell: @_cc}

            if @collection?
                index = @collection.indexOf @
                width = @collection.width
                @_rc = rowCell = Math.floor(index / width)
                @_cc = colCell = index % width
                return {rowCell: rowCell, colCell: colCell}
            return null
        isPassableByActor: (actor, fromTile) -> 
            fromTile = fromTile or actor.currentTile
            return false if @get("passable") is false
            height = @get "elevation"
            jump = actor.get "jmp"
            currentHeight = fromTile.get("elevation")
            return false if (currentHeight + jump < height) 
            return false if (currentHeight - jump > height)
            return false if @isOccupied()
            true
        occupyWith: (obj) -> 
            @occupiedBy = obj;
        deOccupy: -> @occupyWith null
        isOccupied: -> !_.isNull(@occupiedBy)
        getPixelValues: -> {x: @view.shape.x, y: @view.shape.y}
        # Gets the adjacency list for a tile. Pass in false
        # to ignore diagonal adjacency
        getAdjacencyList: (diagonal = true) ->
            # if @AL? then return @AL
            if diagonal is true then inc = 1 else inc = 2
            {rowCell, colCell} = @getCellIndices();
            adjacencyList = []
            c = @collection
            for i in [-1..1]
                if i is 0 then continue
                a = c.getTile(rowCell + i, colCell)
                adjacencyList.push(a) if a?
                a = c.getTile(rowCell, colCell + i)
                adjacencyList.push(a) if a?
                if diagonal is true
                    a = c.getTile(rowCell + i, colCell + -i)
                    adjacencyList.push(a) if a?
                    a = c.getTile(rowCell + -i, colCell + i)
                    adjacencyList.push(a) if a?
            _.sortBy adjacencyList, (v) -> v.get("difficulty")
        # Pass in a row and a col to get the unit distance from this cell
        # If diagonal is true, it will travel diagonally too
        getDistanceFrom: (row, col, shortDiagonal = false) ->
            {rowCell, colCell} = @getCellIndices()
            xDist = Math.abs colCell - col
            yDist = Math.abs rowCell - row
            dist = yDist + xDist
            if !shortDiagonal
                return dist
            else 
                return dist - Math.min(yDist, xDist);

        # Run a BFS from a root node, defaults to actor's location
        # lookingFor - the test to determine if a tile should be placed into the final set
        # nextTest - test to determine if a tile should be searched through, even if 
        # it won't be in the final set
        # Options - see getPathOptions
        BFS: (lookingFor = (-> true), nextTest = (-> true), options = {}) ->
            maxDistance = 0;
            start = @
            start.distanceFromRoot = 0
            options = _.extend(getPathOptions(), options)
            {rowCell, colCell} = start.getCellIndices()
            queue = [start]
            # Lookup table to see if discovered
            discoveryTable = {} 
            # Lookup table for the tile that led us to each other tile, indexed by cid
            progenitors = {}
            # The set of tiles that will be returned, in order of ascending distance from root
            finalSet = []
            discoveryTable[start.cid] = true

            while queue.length 
                tile = queue.shift()
                if (tile isnt start and lookingFor(tile, progenitors[tile.cid]) is true)
                    finalSet.push(tile)
                    if options.returnOnFirst is true then break;
                _.each tile.getAdjacencyList(options.diagonal), (t) ->
                    r = t.getCellIndices()
                    dist = tile.distanceFromRoot + t.get("difficulty")
                    progenitors[t.cid] = tile
                    if (!_.has(discoveryTable, t.cid) and 
                    dist <= options.range and
                    (nextTest(t, progenitors[t.cid]) is true or
                    lookingFor(t, progenitors[t.cid] is true)))
                        t.distanceFromRoot = dist
                        discoveryTable[t.cid] = true;
                        queue.push(t)
            return finalSet



    class Tiles extends Backbone.Collection
        model: Tile
        initialize: () ->
            @width = _boardWidth
            @height= _boardHeight
        getTile: (row, col) ->  
            if row > @height then return null
            else if col > @width then return null
            return @at @width * row + col


    class TileGridItem extends createjs.Bitmap
        constructor: (tile) ->
            super
            tile.view = @
            @model = tile
            _.extend @, Backbone.Events
            @listenTo @model, "highlight", @drawHighlight
        drawHighlight: (color) ->
            size = @model.get("size")
            @shape.alpha = .5
            @shape.graphics.clear().beginFill(color).drawRect(0, 0, size, size).endFill();
            console.log color
        bindHoverEvents: ->
            size = @model.get("size")
            hit = new createjs.Shape()
            hit.graphics.beginFill("#000").beginStroke(1).drawRect(0, 0, size, size)
            @shape.hitArea = hit
            # @shape.addEventListener "mouseover", (=> console.log("clicked", @shape.x, @shape.y))
        render: (x, y) ->
            size = @model.get("size")
            x *= size
            y *= size
            @graphic = new createjs.Graphics().beginStroke("black").drawRect(0, 0, size, size)
            @shape = new createjs.Shape(@graphic);
            @shape.alpha = .3;
            @shape.x = x
            @shape.y = y
            # Render on canvas here
            @bindHoverEvents()
            @shape


    class TileGrid extends Backbone.View
        initialize: ->
            _.bindAll @, "renderTile"
        renderTile: (tile) ->
            index = tile.collection.indexOf tile
            width = @collection.width
            tileRender = new TileGridItem(tile)
            shape = tileRender.render(index % width, Math.floor(index / @collection.width))
            console.log(@container?)
            @container.addChild shape
        render: ->
            @collection.each @renderTile

    renderBlock = (x= 0, y = 0) ->
        if !@rendered
            @gridView.render()
            @rendered = true
        bg = new createjs.Bitmap(@background)
        bg.x = x
        bg.y = y
        bg.background = true
        @addChildAt bg, 0

    createEmptyBlock = ->
        container = new createjs.Container()
        container.render = (x, y) ->
            renderBlock.apply(container, arguments);
        tiles = new Tiles()
        container.gridView = new TileGrid({collection: tiles})
        container.gridView.container = container
        container

    _activeTileSet = null

    # Convert pixels to their tile_dimension based cell index
    pixelToCell = (pixel) -> Math.ceil(pixel / config.tile_dimension)
    # Vice versa
    cellToPixel = (cell) -> cell * tile_dimension
    # Check cache for existence of tiles and set new tiles
    getTilesByIdentifier = (identifier, nameString, blockIndex, done=(->)) ->
        container = do createEmptyBlock
        container.background = "#{maproot}#{nameString}/#{blockIndex}.jpg"
        if (!_.has(tileCache, identifier)) 
            promise = $.getJSON identifier, {}, (response) -> 
                tiles = new Tiles(response, {parse: true})
                container.tiles = tiles;
                container.gridView.collection = tiles;
                tileCache[identifier] = container
            promise.error ->
                console.error "fucked up loading tiles from #{identifier}"
            .always ->
                container.tiles.nameString = nameString
                container.tiles.blockIndex = blockIndex
                _activeTileSet = container
                done(container)
        else 
            container = tileCache[identifier]
            container.tiles.nameString = nameString
            container.tiles.blockIndex = blockIndex
            _activeTileSet = container
            done(container)

    setActiveTiles = (tiles) ->
        objectrenderer.removeChild null, 0
        _activeTileSet = tiles
        renderBlock.apply(tiles);
        objectrenderer.addObject tiles

    # Loads a tileset based on its setID string and its 2d index within the larger set.
    # For example, the "Home" set has a tile blocks from 0,0 to 3,3.
    # When we've finished the AJAX retrieval call, do something with the tiles
    dispatcher.on "load:tiles", (name, blockRow, blockCol, done = (->)) ->
        stage = stageInfo.stages[name]
        width = stage.width
        height = stage.height
        index = width * blockRow + blockCol
        path = "#{maproot}#{name}/#{index}."
        getTilesByIdentifier("#{path}tile", name, index, done)


    # Loads a map background and renders it via objectrenderer, and loads the corresponding tiles
    # unless the done function parameter is set explicitly to false
    dispatcher.on "load:map", (name, blockRow, blockCol, done = null, type='jpg') ->
        if (!done?) 
            done = (tiles) ->
                setActiveTiles(tiles)
        stage = stageInfo.stages[name]
        width = stage.width
        height = stage.height
        index = width * blockRow + blockCol
        path = "#{maproot}#{name}/#{index}."
        getTilesByIdentifier("#{path}tile", name, index, done) unless done is false

    return {
        getActiveTiles: -> _activeTileSet
        setActiveTiles: (tiles) -> setActiveTiles tiles
        getMapRoot: -> maproot
        Tile: Tile
        setStageInfo: (stageInfo_) -> stageInfo = stageInfo_
        getTilesByIdentifier: (identifier) -> 
            getTilesByIdentifier identifier
        pixelToCell: (pixel) -> pixelToCell pixel
        cellToPixel: (pixel) -> cellToPixel cell
        getBoardWidthCells: -> 
            _boardWidth
        getBoardHeightCells: -> 
            _boardHeight
        getBoardHeightPixels: -> 
            _boardHeight * config.tile_dimension
        getBoardWidthPixels: -> 
            _boardWidth * config.tile_dimension
        getTileDimension: -> 
            config.tile_dimension
        tileEntryFunctions:
            # Only entered from the left
            l: (x,y) -> x>0
            # Only from right
            r: (x,y) -> x<0
            # from top
            t: (x,y) -> y>0
            # from bottom
            b: (x,y) -> y<0
            # Enter from left or right
            rl: (x,y) -> l(x,y) or r(x,y)
            # Left or top 
            tl: (x,y) -> l(x,y) or t(x,y)
            # Left or bottom
            bl: (x,y) -> l(x,y) or b(x,y)
            # Left right top
            trl: (x,y) -> tr(x,y) or l(x,y)
            # TBL
            tbl: (x,y) -> bl(x,y) or t(x,y)
            # left top bottom
            rbl: (x,y) -> l(x,y) or rb(x,y)
            # Right or top
            tr: (x,y) -> r(x,y) or t(x,y)
            # right or bottom
            rb: (x,y) -> r(x,y) or b(x,y)
            # right top bottom
            trb: (x,y) -> tr(x,y) or b(x,y)
            # top or bottom
            tb: (x,y) -> b(x,y) or t(x,y)
            # ALl directions
            e: -> true
    }

