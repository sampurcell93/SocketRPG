define ["socket"], (io) ->
    class Pool extends Backbone.Model
        initialize: ->
            @socket = io("/#{@get("hashid")}");
        parse: (response) ->
            response.created_at = new Date(response.created_at);
            response;

    class Pools extends Backbone.Collection
        model: Pool
        url: -> "/pools"
        initialize: ->
            @socket = io("/poolManager");

    activePools = null;

    getActivePools = (done=->) ->
        if !activePools?
            activePools = new Pools()
            activePools.fetch().success ->
                done(activePools)
        else done(activePools)

    addFreePlayer = (playerID) ->

    class PoolListItem extends Marionette.ItemView
        template: "#pool-list-item"
        tagName: 'li'
        events:
            "click .js-join-pool": ->
                @model.join()

    class PoolListView extends Marionette.CollectionView
        childView: PoolListItem
        el: "#active-pools"


    return {
        getActivePools: -> getActivePools.apply(@, arguments)
        addPlayerToPool: (playerID, poolID) -> 
            activePools._byId?.addPlayer(playerID);
        addFreePlayer: (playerID) -> addFreePlayer.apply @, arguments
        getPoolsView: (collection, opts) -> new PoolListView({collection: collection}, opts)
    }
