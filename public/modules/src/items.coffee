define ['module', 'modifiers'] , (module, modifiers) ->
    ModifierCollection = modifiers.ModifierCollection
    Modifier = modifiers.Modifier 

    config = module.config()

    # Since we're storing items in a json dictionary, 
    # functions need to be assignmed at runtime.
    # functions accept the target (npc model or subclass thereof) 
    # of the item's use, and should be called in the item's context
    _usefns = {
        "Phoenix Down": (target) ->
            if !target.isDead()
                target.takeDamage(5).takeDamage(-5)
            else target
    }
    _wearfns = {
    }

    # Common functions for modifying existing attribute values
    _mods = {
        "/3": (t, v) -> v/3
        "/2": (t, v) -> v/2
        "x2": (t, v) -> v*2
        "x3": (t, v) -> v*3
        "x4": (t, v) -> v*4
        "x5": (t, v) -> v*5
        "x6": (t, v) -> v*6
    }

    class Slots extends Backbone.Model
        defaults: ->
            slots = ["head", "hands", "feet", "neck", "waist", "armor", "legs"]
            obj = {}
            _.each slots, (slot) =>
                obj[slot] = null
            obj


    class Item extends Backbone.Model
        idAttribute: 'name'
        defaults: 
            action: 'minor'
            belongsTo: null
            canEquip: false
            canUse: true
            equipped: false
            level: 1
            max_uses: 1
            # If the item modifies attributes, store them
            modifiers: new ModifierCollection
            name: null
            quantity: 1
            ranged: false
            role: 1
            slot: null
            uses: 1
            weight: 1
            # When the item is used, do this
            use: -> 
            # When the item is worn, do this
            wear: -> 
        isNew: -> true
        # is the item capable of being used at range?
        isRanged: -> @get "ranged"
        initialize: ({name, max_uses})->
            @on "change:equipped", (model, value) =>
                if value is true then @onEquip()
                else @onUnEquip()
            @set "uses", max_uses
        isEquipped: -> @get "equipped"
        isEquippable: -> @get "canEquip"
        onEquip: (target = @belongsTo())->
            target.applyModifiers(@get("modifiers"), {donetext: 'Equipped ' + @get("name")})
            if board.hasState("battle")
                target.takeAction(@get("action"))
            @
        onUnEquip: (target = @belongsTo()) ->
            target.removeModifiers(@get("modifiers"), {donetext: 'Unequipped ' + @get("name")})
            @
        isUsable: -> @get "canUse"
        onUse: (target = @belongsTo())-> 
            @get("use")?.call(@, target)
            # Decrement the item's uses
            @set("uses", @get("uses") - 1)
            # If no uses left, the item is expended
            if @get("uses") is 0  
                @set("quantity", @get("quantity") - 1)
                # If no more of item, destroy this
                do @destroy if @get("quantity") is 0
                # Otherwise, reset the use count
                else @set("uses", @get("max_uses"))
            target.applyModifiers(@get "modifiers").takeAction(@get("action"))
            @
        belongsTo: (model) ->
            belongsTo = @get "belongsTo"
            if _.isUndefined(model) then return belongsTo
            else return _.isEqual(belongsTo, model)
        parse: (response) ->
            modifiers = new ModifierCollection
            _.each response.modifiers, (mod) =>
                if _.isString(mod.mod) then mod.mod = _mods[mod.mod]
                modifiers.add modifier = new Modifier(mod)
            response.modifiers = modifiers
            response


    # Simply a collection of items, regardless of context
    class Inventory extends Backbone.Collection
        model: Item
        type: 'Inventory'
        url: config.items_url
        parse: (resp) ->
            _.each resp, (item) ->
                item.use  = _usefns[item.name]  || ->
                item.wear = _wearfns[item.name] || ->
            resp
        comparator: (model) ->
            -model.get("equipped")
        getTotalItems: ->
            sum = 0
            _.each @models, (item) =>
                sum += item.get "quantity"
            sum
        toJSON: (save=false) ->
            if !save then return super
            arr = super
            _.each arr, (item) =>
                item.belongsTo = item.belongsTo?.get("id")
            arr
        # Returns the item if it is contained, null otherwise
        contains: (item) ->
            if _.isString(item)
                filter = (check) -> check.get("name") is item
            else if _.isObject(item) 
                filter = (check) -> check.get("name") is item.get("name")
            else if _.isUndefined(item) then throw Error("Passed an undefined item to Inventory.contains.")
            for i in @models
                if filter(i) is true then return i
            return null


    _items = new Inventory
    _items.fetch 
        success: (coll, resp) -> 
            console.log _items
            hub.dispatcher.dispatch "items:loaded"
        error: (coll, resp) ->
            console.error resp
        parse: true

    # Name can be either a string id or an object with form
    # {id: 'Name', q: n} where qu is quantity
    getItem = (name, opts={}) ->
        quantity = 1
        if _.isObject(name)
            item = _items._byId[name.id]
            quantity = name.q
        else item = _items._byId[name]
        if _.isObject(item)
            item = item.clone()
            item.set "quantity", quantity
            if opts.belongsTo 
                item.set "belongsTo", opts.belongsTo
            return item
        else null

    get = (name, opts) ->
        if typeof name is "string" then return getItem name, opts
        else if _.isArray name 
            inventory = new Inventory
            _.each name, (id) ->
                inventory.add getItem(id, opts)
            inventory

    return {
        get: (name, opts={}) -> 
            get name, opts
        getDefaultInventory: (opts = {}) ->
            d = get ["Tattered Cloak", "Bread"]
            if opts.belongsTo and d
                _.each d.models, (item) =>
                    item.set("belongsTo", opts.belongsTo)
            d
    }