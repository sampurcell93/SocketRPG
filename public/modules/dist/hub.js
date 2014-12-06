(function() {
  define(['marionette'], function(Marionette) {
    var Hub, StateHandler, hub;
    StateHandler = (function() {
      function StateHandler(states) {
        var exclusions;
        if (states == null) {
          states = {
            loading: false,
            traveling: true,
            battling: false,
            intro: false
          };
        }
        exclusions = {
          intro: ["*"]
        };
        StateHandler.prototype.hasState = function(whichState) {
          return states[whichState] === true;
        };
        StateHandler.prototype.getActiveStates = function() {
          return _.pick(states, function(val, key) {
            return val === true;
          });
        };
        StateHandler.prototype.clearStates = function() {
          _.each(states, function(val, key) {
            return states[key] = false;
          });
          return states;
        };
        StateHandler.prototype.addState = function(stateToAdd) {
          if (_.has(states, stateToAdd)) {
            return states[stateToAdd] = true;
          }
        };
        StateHandler.prototype.removeState = function(stateToRemove) {
          if (_.has(states, stateToRemove)) {
            return states[stateToRemove] = false;
          }
        };
      }

      return StateHandler;

    })();
    Hub = Marionette.Application.extend({
      states: new StateHandler(),
      StateHandler: StateHandler
    });
    hub = new Hub();
    hub.dispatcher = hub.vent;
    hub.dispatcher.dispatch = hub.vent.trigger;
    return window.hub = hub;
  });

}).call(this);
