define ['actor'], (actors) ->
    class User extends Backbone.Model
        idAttribute: '_id'

    class SingleUserForLoading extends Backbone.View
        template: "<%= username %>"
        tagName: "li"
        className: 'single-user-for-loading'
        render: ->
            @$el.html(_.template(@template, @model.toJSON()))
            @
        events: 
            "click": ->
                user = new User({username: @model.get("username")}) 
                promise = _user.fetch({parse: true})
                promise.success = -> 
                    console.log("fetched user", _user)

    class Loader extends Backbone.View
        el: "#load-game"
        initialize: ({@username}) ->
            _.bindAll @, "addUser"
        addUser: (user) ->
            @$("ul").append(new SingleUserForLoading({model: user}).render().el)
            @
        render: ->
            @collection.each @addUser
            @$el.removeClass "hidden"
            @


    class SignUp extends Backbone.View
        template: $("#new-game").html()
        render: ->
            template = _.template @template
            @$el.html template()
            @
        events: ->
            "click .js-start-game": -> 
                user = new User username: 'Sams', password: 'Sampass'
                
                _user.save null, 
                    success: (u, resp) => 
                        console.log("created new user")

