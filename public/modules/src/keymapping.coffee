define ["actor"], (actors) ->

    dispatcher = hub.dispatcher

    # Used for checking key combos
    isPressed = {}

    # Key Enum
    keys = {
        ENTER: 13
        SPACE: 32
        UP: 38
        DOWN: 40
        LEFT: 37
        RIGHT: 39
        ESCAPE: 27
        # O
        MAPMAKEROVERRIDE: 79
        # N
        NEW: 78
        # L
        LOAD: 76
        # M
        MAPMAKER: 77
        # B
        BATTLE: 66
        # C
        CLEAR: 67
        # D
        DEFAULT: 68
        # E
        EXPORTMAP: 69
        # O
        GRID: 71
        # S
        STATE: 83
        # Z
        ZOOMIN: 90
        # O
        ZOOMOUT: 79
    }


    stateFns = {
        intro: (key) ->
            switch key
                when keys["NEW"] then dispatcher.dispatch("game:new")
                when keys["LOAD"] then dispatcher.dispatch("show:stage")
        loading: (key) ->

        battling: (key) ->
        traveling: (key) ->
            # Only allow key presses when a player is active
            actor = actors.getCurrentActor()
            if actor?
                switch key
                    when keys["UP"]    then actor.moveUp()
                    when keys["RIGHT"] then actor.moveRight()
                    when keys["DOWN"]  then actor.moveDown()
                    when keys["LEFT"]  then actor.moveLeft()
                    when keys["MAPMAKER"] then dispatcher.dispatch("toggle:mapmaker")
                    when keys['BATTLE'] then dispatcher.dispatch("start:battle")
                    # when keys['SPACE'] then menus.toggleMenu()
            # else 
                # console.log "you can't go now: a player character is NOT active. The active player is "
                # console.log battler.getActive()
        # CUTSCENE: (key) ->
        # TRAVEL: (key) -> 
            # PC = taskrunner.getPC()
            # switch key
                # when keys["UP"]    console.l
                # when keys["RIGHT"] then PC.moveRight()
                # when keys["DOWN"]  then PC.moveDown()
                # when keys["LEFT"]  then PC.moveLeft()
                # when keys['CLEAR'] then mapper.clearChunk window.stage
                # when keys['BATTLE'] 
                #     board.addState("battle").removeState "travel"
                #     menus.closeAll()
                # when keys['SPACE'] then menus.toggleMenu("travel")
                # when keys['DEFAULT'] then ut.launchModal JSON.stringify(mapcreator.getDefaultChunk())
                # when keys['ZOOMIN'] then board.zoomIn 1
                # when keys['ZOOMOUT'] then board.zoomOut 1
                # when keys['STATE'] then console.log board.getState()
        # DRAWING: (key) ->
            # switch key
            #     when keys["ENTER"], keys["SPACE"]
            #         dialog.finish()
            #     when keys['ESCAPE'] then dialog.clear()
        # MENUOPEN: (key) ->
            # switch key
            #     when keys['UP'] then menus.selectPrev()
            #     when keys['DOWN'] then menus.selectNext()
            #     when keys['ENTER'] then menus.activateMenuItem()
            #     when keys['ESCAPE'] then menus.closeAll()
        # LOADING: -> false # Can't do shit when loading brah
    }

    # High level delegator based on the key pressed and the current board state.
    delegate = (key) ->
        _.each hub.states.getActiveStates(), (onVal, state) ->
            stateFns[state](key)

    $canvas = $("canvas").focus();
    $canvas.on "keydown", (e) =>
        key = e.keyCode || e.which
        isPressed[key] = true
        delegate key
    
    $canvas.on "keyup", (e) =>
        key = e.keyCode || e.which      
        isPressed[key] = false

    $("body").on("keyup", (e) -> if (e.keyCode == keys['MAPMAKEROVERRIDE']) then dispatcher.dispatch("toggle:mapmaker"))