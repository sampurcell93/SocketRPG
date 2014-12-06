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
        isPassableByActor: (actor) -> @get("passable")
        occupyWith: (obj) -> @occupiedBy = obj;
        isOccupied: -> !_.isNull(@occupiedBy)


    class Tiles extends Backbone.Collection
        model: Tile
        initialize: () ->
            @width = _boardWidth
            @height= _boardHeight
        getTile: (row, col) ->  @at @width * row + col


    class TileGridItem extends createjs.Bitmap
        constructor: ->
            super
        initialize: ->
            @model.view = @
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
            objectrenderer.addObject @shape
            @shape


    class TileGrid extends Backbone.View
        initialize: ->
            _.bindAll @, "renderTile"
        renderTile: (tile) ->
            index = tile.collection.indexOf tile
            width = @collection.width
            tileRender = new TileGridItem()
            tileRender.model = tile
            tileRender.render(index % width, Math.floor(index / @collection.width))
        render: ->
            @collection.each @renderTile

    _activeTileSet = null

    initializeEmptyTileSet = ->
        _activeTileSet = new Tiles()
        _activeTileSet.add new Tile for i in [0...(_boardHeight*_boardWidth)]
        _activeTileSet

    do initializeEmptyTileSet

    t = new TileGrid({collection: _activeTileSet})
    t.render()

    # Convert pixels to their tile_dimension based cell index
    pixelToCell = (pixel) -> Math.ceil(pixel / config.tile_dimension)
    # Vice versa
    cellToPixel = (cell) -> cell * tile_dimension
    # Check cache for existence of tiles and set new tiles
    setActiveTiles = (identifier, nameString, blockIndex) ->
        if (!_.has(tileCache, identifier)) 
            promise = $.getJSON identifier, {}, (tiles) -> 
                tiles = new Tiles(tiles, {parse: true})
                tileCache[identifier] = tiles
                _activeTileSet = tiles
            promise.error ->
                console.error "fucked up loading tiles from #{identifier}"
                _activeTileSet = initializeEmptyTileSet()
            .always ->
                _activeTileSet.nameString = nameString
                _activeTileSet.blockIndex = blockIndex
        else 
            _activeTileSet = tileCache[identifier]
            _activeTileSet.nameString = nameString
            _activeTileSet.blockIndex = blockIndex

    # Loads a map
    dispatcher.on "load:map", (name, blockRow, blockCol, type='jpg') ->
        stage = stageInfo.stages[name]
        width = stage.width
        height = stage.height
        index = width * blockRow + blockCol
        objectrenderer.removeBackground()
        path = "#{maproot}#{name}/#{index}."
        objectrenderer.addBackground("#{path}#{type}")
        setActiveTiles("#{path}tile", name, index)
        dispatcher.dispatch "toggle:mapmaker"


    return {
        getMapRoot: -> maproot
        Tile: Tile
        setStageInfo: (stageInfo_) -> stageInfo = stageInfo_
        getActiveTiles: -> _activeTileSet
        setActiveTiles: (identifier) -> 
            setActiveTiles identifier
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

