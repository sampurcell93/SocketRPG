define ->
            
    # CreateJS Board setup
    canvas = document.getElementById "game-canvas"
    dispatcher = hub.dispatcher
    $canvas = $ canvas
    stage = new createjs.Stage canvas
    stage.enableMouseOver 10
    stage.enableDOMEvents true
    _ticker = createjs.Ticker
    _ticker.addEventListener "tick", (tick) ->
        try 
            stage.update() unless tick.paused
            # console.log(stage.children);
        catch 
            _ticker.setPaused true
            # alert "hey you dun goofed with the ticker somehow"
            console.error _error


    dispatcher.on "remove:marker", (marker) -> stage.removeChild marker
    dispatcher.on "add:marker", (marker, at) -> 
        addObject marker, at
    dispatcher.on "remove:background", (marker) -> do removeBackground


    addObject = (o, at) ->
        if stage.children[0]? and stage.children[0].background is true and at < 1
            at = 1
        if _.isUndefined(at)
            stage.addChildAt o, at
        else 
            stage.addChild o

    removeBackground = ->
        hasBackground = stage.getChildAt(0).background
        if hasBackground is true
            stage.removeChildAt(0) 
            stage.getChildAt(0).background = false

    return {
        getTicker: -> _ticker
        addBackground: (url, x = 0 , y = 0) -> 
            child = new createjs.Bitmap(url)
            child.x = x
            child.y = y
            child.background = true
            stage.addChildAt child, 0
        removeBackground: -> do removeBackground

        addObject: (o, at) ->
            addObject.apply @, arguments

    }