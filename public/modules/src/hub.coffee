# This module provides a single app instance
# Has messenger and commands built in to encourage decoupling
# By Sam Purcell, 2014
define ['marionette'], (Marionette) ->

    class StateHandler
        constructor: (states= {
                loading: false
                traveling: true
                battling: false
                intro: false
            }) ->

            # States that cannot be held at the same time
            exclusions = {
                # Intro must be a standalone state
                intro: ["*"]
            }

            StateHandler::hasState = (whichState) -> 
                states[whichState] is true

            StateHandler::getActiveStates = ->
                _.pick states, (val, key) -> val is true

            StateHandler::clearStates = ->
                _.each states, (val, key) ->
                    states[key] = false
                states

            StateHandler::addState = (stateToAdd) ->
                if _.has states, stateToAdd
                    states[stateToAdd] = true;

            StateHandler::removeState = (stateToRemove) ->
                if _.has states, stateToRemove
                    states[stateToRemove] = false;


    Hub = Marionette.Application.extend({
        states: new StateHandler()
        StateHandler: StateHandler
    });

    hub = new Hub()
    # Semantic aliasing for messenger/dispatcher pattern
    hub.dispatcher = hub.vent
    hub.dispatcher.dispatch = hub.vent.trigger
    # The only global binding we will use, to avoid having to include the hub as a dep in each module
    return window.hub = hub

