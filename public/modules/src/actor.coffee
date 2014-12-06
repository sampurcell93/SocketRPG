define ["module", "tiler"], (module, tiler) ->

    dispatcher = hub.dispatcher
    tile_dimension = tiler.getTileDimension()

    # Private actor methods can be called using actor.call(@, a1, a2, an)
    isExitingBlockBounds = (x,y) ->
        if x < 0 or y < 0 or x > tiler.getBoardWidthPixels() - tile_dimension or y > tiler.getBoardHeightPixels() - tile_dimension
            return true
        return false
    resetCoordsToNewChunk = (dx, dy) ->
        # Move right
        if dx is 1
            @marker.x = 0
        else if dx is -1
            @marker.x = tiler.getBoardWidthPixels() - tile_dimension
        if dy is 1
            @marker.y = 0
        else if dy is - 1
            @marker.y = tiler.getBoardHeightPixels() - tile_dimension


    # Create actors with private instance vars
    ActorSpawner = ->
        return {
            spawn: ->
                Actor = Backbone.Model.extend
                    defaults: ->
                        return {
                            AC: 10
                            atk: 1
                            currentStage: 0
                            currentStageName: 'Home'
                            currentBlockRow: 0
                            currentBlockCol: 0
                            carryingCapacity: 100
                            eco: 10
                            maxEco: 10
                            HP: 100
                            maxHP: 100
                            init: 1
                            # inventory: items.Inventory()
                            # modifiers: new ModifierCollection()
                            # statuses: new ModifierCollection()
                            # skills: cast.Skillset()
                            jmp: 1
                            level: 1
                            name: "Actor"
                            path: 'peasant'
                            # powers: powers.PowerSet()
                            race: 'Human'
                            range: 1
                            regY: 0
                            type: 'NPC'
                            # slots: items.Slots()
                            spd: 5
                            spriteimg: "images/hero.png"
                            XP: 0
                        }
                    # expects x and inverse-y deltas, IE move(0, 1) would be a downward move by 1 "square"
                    # Returns null if the move will not work, or returns the new coords if it does.
                    move: (dx, dy, spaces=1) ->
                        return null if @moving is true
                        return null if spaces < 1
                        x = @marker.x + dx*tile_dimension
                        y = @marker.y + dy*tile_dimension
                        @turnSprite dx, dy
                        isExitingBounds = isExitingBlockBounds(x,y)
                        return null if hub.states.hasState("traveling") is false and isExitingBounds is true
                        if (isExitingBounds and hub.states.hasState("traveling"))
                            @set "currentBlockRow" , newBlockRow = @get("currentBlockRow") + dy
                            @set "currentBlockCol" , newBlockCol = @get("currentBlockCol") + dx
                            dispatcher.dispatch("load:map", @get("currentStageName"), newBlockRow, newBlockCol)
                            resetCoordsToNewChunk.call(@, dx,dy)
                            @currentTile = tiler.getActiveTiles().getTile(tiler.pixelToCell(y), tiler.pixelToCell(x))
                            if (@currentTile and @currentTile.isPassableByActor(actor))
                                @moving = false
                                @move.call(@,dx,dy,--spaces)
                        else 
                            @moving = true
                            @currentTile = tiler.getActiveTiles().getTile(tiler.pixelToCell(y), tiler.pixelToCell(x))
                            # console.log tiler.getActiveTiles(), tiler.pixelToCell(y), tiler.pixelToCell(x)
                            if (@currentTile and @currentTile.isPassableByActor(actor))
                                @marker.x = x
                                @marker.y = y
                                @moving = false
                                @move.call(@,dx,dy,--spaces)
                        @moving = false

                    createSprite: ->
                        @walkopts = _.extend @walkopts, {images: [@get("spriteimg")]}
                        @sheets = {
                            "-1,0" : new createjs.SpriteSheet(_.extend @walkopts, {frames: @frames.left})
                            "1,0":   new createjs.SpriteSheet(_.extend @walkopts, {frames: @frames.right})
                            "0,-1":  new createjs.SpriteSheet(_.extend @walkopts, {frames: @frames.up})
                            "0,1" :  new createjs.SpriteSheet(_.extend @walkopts, {frames: @frames.down})
                        }
                        sheet = @sheets["0,1"]
                        sheet.getAnimation("run").speed = .13
                        sheet.getAnimation("run").next = "run"
                        sprite = new createjs.Sprite(sheet, "run")
                        @marker = new createjs.Container()
                        @marker.regY =  @get("regY")
                        @marker.addChild sprite
                        @marker.icon = sprite
                        nameobj = new createjs.Text(@get("name"), "14px Arial", "#fff")
                        @marker.addChild nameobj
                        dispatcher.dispatch("add:object", @marker);
                        @
                    walkopts: {
                        framerate: 30
                        animations: 
                            run: [0,3]
                        images: ["images/sprites/hero.png"]
                    }
                    frames: {
                        # The in place animation frames for the default NPC
                        down: [[0, 0, 55, 55, 0]
                                [55, 0, 55, 55, 0]
                                [110, 0, 55, 55, 0]
                                [165, 0, 55, 55, 0]]
                        left: [[0, 55, 55, 55, 0]
                            [55, 55, 55, 55, 0]
                            [110, 55, 55, 55, 0]
                            [165, 55, 55, 55, 0]]
                        right: [[0, 110, 55, 55, 0]
                            [55, 110, 55, 55, 0]
                            [110, 110, 55, 55, 0]
                            [165, 110, 55, 55, 0]]
                        up: [[0, 165, 55, 55, 0]
                            [55, 165, 55, 55, 0]
                            [110, 165, 55, 55, 0]
                            [165, 165, 55, 55, 0]]
                    }
                    initialize: ->
                        @createSprite.call(@)
                        @active = false
                        @currentTile = null
                        @dead = false
                        @defending = false
                        @dispatched = false
                        # What phase of the user's turn are they at? Max 3
                        @turnPhase = 0

                    # Wrapper functions for basic moves
                    moveRight: (spaces=1) -> @move  1, 0, spaces
                    moveLeft: (spaces=1) ->  @move -1, 0, spaces
                    moveUp: (spaces=1) ->    @move  0, -1, spaces
                    moveDown: (spaces=1) ->  @move  0, 1, spaces
                    turnSprite: (x,y) ->
                        if x isnt 0 and y isnt 0 then x = 0
                        sheet = @sheets[x+","+y]
                        sheet.getAnimation("run").speed = .13
                        if !sheet then alert("FUCKED UP IN TURN")
                        @marker.icon.spriteSheet = sheet
                    obtain: (item, quantity=1) ->
                        existing = @hasItem(item)
                        if existing 
                            quantity += existing.get("quantity")
                            item = existing
                        item.set("quantity", quantity)
                        item.set("belongsTo", @)
                        item.set("equipped", false)
                        @get("inventory").add item
                        @
                    hasItem: (item) -> 
                        @get("inventory").contains item

                return new Actor()

        }


    # class Spawner
    #     constructor: (@spawnerAction=->new Actor) ->
    #     spawn: -> do @spawnerAction

    # class SpawnerView
    #     constructor: (spawner) ->
    #         if !spawner 
    #             throw Error("Can't create a spawner view without a valid spawner.")

    _currentActor = null


    return {
        # Returns a spawner that spawns actors according to the callback spawnerType
        # IE getSpawner(-> new Ghost())
        getSpawner: (spawnerType) -> new ActorSpawner();
        setCurrentActor: (actor) -> _currentActor = actor;
        getCurrentActor: -> _currentActor
    }
