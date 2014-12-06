define ->
    _events = hub.dispatcher

    class Message extends Backbone.Model
        defaults: ->
            text: "Message!"
    class Messages extends Backbone.Collection
        model: Message

    class Line extends Backbone.View
        tagName: 'li'
        template: "<%= text %>"
        initialize: ->
            @listenTo @model, "destroy": -> @$el.text("");
        render: ->
            template = _.template(@template)
            @$el.html(template(@model.toJSON()))
            @

    class Console extends Backbone.View
        el: '.game-console'
        msgLen: 5
        visible: true
        initialize: ->
            @listenTo @collection, 
                "add": @emit
        trimOldMessages: ->
            if @collection.length > @msgLen
                diff = @collection.length - @msgLen
                to_prune = @collection.slice(0,diff)
                while to_prune.length
                    to_prune.shift().destroy()
            @
        scrollToBottom: (speed="fast") ->
            @$("ol").animate {scrollTop: @$("ol")[0].scrollHeight}, speed
        emit: (model) ->
            line = new Line model: model
            $el = @$el
            @$("ol").append(line.render().el)
            @trimOldMessages()
            @scrollToBottom()
        show: ->
            @visible = true
            @$el.removeClass("hidden")
            @scrollToBottom(0)
            @
        hide: ->
            @visible = false
            @$el.addClass("hidden")
            @
        toggle: ->
            if @visible then @hide()
            else @show()
        events: 
            "click .js-toggle": "toggle"
            "dblclick": "hide"

    _console = new Console({collection: new Messages})

    handleEvent = (type) ->
        type = type.split(":")
        switch type[0]
            when "state"
                activity.emit "State changed to #{type[1]}"
            when "items"
                activity.emit "Items were #{type[1]}"
            when "powers"
                activity.emit "Powers were #{type[1]}"
            when "menu"
                break;
            when "battle"
                if type[1] is "timerdone"
                    activity.emit "#{arguments[1].get('name')} failed to act, and lost an action"
            when "game"
                activity.emit "Game #{type[1]} loaded"
            else 
                activity.emit type.join(":")

    _events.on "all", handleEvent

    activity = {
        emit: (message, opts) => _console.collection.add new Message(_.extend {text: message}, opts)
        hide: -> _console.hide()
        show: -> _console.show()
        toggle: -> _console.toggle()
    }


