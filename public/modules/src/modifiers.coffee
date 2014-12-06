define ->
    class Modifier extends Backbone.Model
        defaults: 
            # Which property is the modifier targeting?
            prop: null
            # By how much should it be modified? Can be a function.
            # mod: (target, currentval) -> currentval * 3
            mod: 0
            # For how many turns should this last?
            turns: null
            # If this lasts for turns, when should it be evaluated? 
            timing: "start"
            # Is this effect permanant?
            perm: false
            # From where does the modifier originate? Should be a class name string.
            type: 'Item'
            # What object (actor?) is this modifier acting on?
            actsOn: null
        prop: -> @get "prop"
        mod:  -> @get "mod"

    class ModifierCollection extends Backbone.Collection
        model: Modifier



    return {
        Modifier: Modifier
        ModifierCollection: ModifierCollection
    }