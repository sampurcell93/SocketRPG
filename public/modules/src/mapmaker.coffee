define ['tiler'], (tiler) ->

    root = tiler.getMapRoot()

    parseBool = (str) ->
        str = str.toLowerCase()
        if str is "true" then true 
        else if str is "false" then false
        else str

    class tileEditor extends Backbone.View
        el: "#tile-editor"
        singleTemplate: $("#single-tile-editor-template").html()
        groupTemplate: $("#group-tile-editor-template").html()
        updateSelectedTilesFromDOMInputs: ->
            attrs = [{name: 'difficulty'}, {name: "elevation"}, {name: 'passable'}]
            _.each attrs, (val, key) =>
                inputval = @$(".val-" + val.name).val()
                if !inputval then return true
                attrs[key].value = inputval
                parsed_input = parseBool(attrs[key].value)
                if typeof parsed_input is "boolean"
                    attrs[key].value = parsed_input
                parsed_input = parseInt(attrs[key].value)
                if typeof parsed_input is "number" and !_.isNaN(parsed_input)
                    attrs[key].value = parsed_input
            _.each @tiles, (tile) =>
                _.each attrs, (attr) =>
                    tile.set(attr.name, attr.value)


        events: 
            'click .js-save-map': ->
                tiles = grid.collection
                @updateSelectedTilesFromDOMInputs()
                tiles.url = "/mapping/#{tiles.nameString}/#{tiles.blockIndex}"
                promise = tiles.sync "create", tiles, {
                    success: =>
                        console.log "success"
                    error: ->
                        console.log "error"
                }

                promise.always =>  @$el.off('click', '.js-save-map');


        render: ->
            if @tiles.length is 1
                template = _.template(@singleTemplate)
                @$el.html(template(@tiles[0].toJSON())).show()
            else 
                template = _.template(@groupTemplate)
                @$el.html(template({numtiles: @tiles.length})).show()



    class EditableGridItem extends Marionette.ItemView
        model: tiler.Tile
        tagName: 'li'
        template: "#grid-item"
        className: 'grid-item'
        initialize: (attrs) ->
            @listenTo attrs.model, {
                "all": (attr, model, newval) =>
                    if (attr.indexOf("change") != -1)
                        val = attr.split(":")[1]
                        @$(".#{val}").text(newval)
            }


    class EditableGrid extends Marionette.CollectionView
        childView: EditableGridItem
        el: '.mapmaker-grid'
        showing: false
        hide: ->
            @showing = false
            @$el.hide()
        show: ->
            @showing = true
            @$el.show()
        toggle: ->
            if @showing
                do @hide
            else do @show
        beforeRender: ->
            @$el.empty()
        onRender: ->
            @$el.selectable({
                appendTo: '.mapmaker-grid'
                filter: 'li.grid-item'
                start: =>
                    @selected = {}
                selected:  (e, ui) =>
                    sel = ui.selected
                    @selected[$(sel).index()] = sel
                stop: (e, ui) =>
                    width = @collection.width
                    selected_tiles = []
                    _.each @selected, (val, i) =>
                        selected_tiles.push(@collection.at i)
                    editor = new tileEditor()
                    editor.tiles = selected_tiles
                    console.log(selected_tiles.length)
                    editor.render()
            })


    dispatcher = hub.dispatcher
    grid = new EditableGrid()

    dispatcher.on "toggle:mapmaker", -> 
        active_map = tiler.getActiveTiles() 
        console.log(active_map)
        grid.collection = active_map
        grid.render()
        grid.toggle()
