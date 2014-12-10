(function() {
  define(["actor"], function(actors) {
    var $canvas, delegate, dispatcher, isPressed, keys, stateFns;
    dispatcher = hub.dispatcher;
    isPressed = {};
    keys = {
      ENTER: 13,
      SPACE: 32,
      UP: 38,
      DOWN: 40,
      LEFT: 37,
      RIGHT: 39,
      ESCAPE: 27,
      MAPMAKEROVERRIDE: 79,
      NEW: 78,
      LOAD: 76,
      MAPMAKER: 77,
      BATTLE: 66,
      CLEAR: 67,
      DEFAULT: 68,
      EXPORTMAP: 69,
      GRID: 71,
      STATE: 83,
      ZOOMIN: 90,
      ZOOMOUT: 79
    };
    stateFns = {
      intro: function(key) {
        switch (key) {
          case keys["NEW"]:
            return dispatcher.dispatch("game:new");
          case keys["LOAD"]:
            return dispatcher.dispatch("show:stage");
        }
      },
      loading: function(key) {},
      battling: function(key) {},
      traveling: function(key) {
        var actor;
        actor = actors.getCurrentActor();
        if (actor != null) {
          switch (key) {
            case keys["UP"]:
              return actor.moveUp();
            case keys["RIGHT"]:
              return actor.moveRight();
            case keys["DOWN"]:
              return actor.moveDown();
            case keys["LEFT"]:
              return actor.moveLeft();
            case keys["MAPMAKER"]:
              return dispatcher.dispatch("toggle:mapmaker");
            case keys['BATTLE']:
              return dispatcher.dispatch("start:battle");
          }
        }
      }
    };
    delegate = function(key) {
      return _.each(hub.states.getActiveStates(), function(onVal, state) {
        return stateFns[state](key);
      });
    };
    $canvas = $("canvas").focus();
    $canvas.on("keydown", (function(_this) {
      return function(e) {
        var key;
        key = e.keyCode || e.which;
        isPressed[key] = true;
        return delegate(key);
      };
    })(this));
    $canvas.on("keyup", (function(_this) {
      return function(e) {
        var key;
        key = e.keyCode || e.which;
        return isPressed[key] = false;
      };
    })(this));
    return $("body").on("keyup", function(e) {
      if (e.keyCode === keys['MAPMAKEROVERRIDE']) {
        return dispatcher.dispatch("toggle:mapmaker");
      }
    });
  });

}).call(this);
