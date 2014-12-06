define ->
            
    # CreateJS Board setup
    canvas = document.getElementById "game-canvas"
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

    hub.dispatcher.on("show:stage", -> console.log(stage))

    return {
        getTicker: -> _ticker
        addBackground: (url) -> 
            child = new createjs.Bitmap(url)
            child.background = true
            stage.addChildAt child, 0 
        removeBackground: ->
            stage.removeChildAt(0) if stage.getChildAt(0).background is true
        addObject: (o, at) ->
            if stage.children[0]? and stage.children[0].background is true and at < 1
                at = 1
            if _.isUndefined(at)
                stage.addChildAt o, at
            else 
                stage.addChild o

    }