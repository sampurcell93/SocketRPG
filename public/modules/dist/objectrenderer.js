(function() {
  define(function() {
    var $canvas, addObject, canvas, dispatcher, removeBackground, stage, _ticker;
    canvas = document.getElementById("game-canvas");
    dispatcher = hub.dispatcher;
    $canvas = $(canvas);
    stage = new createjs.Stage(canvas);
    stage.enableMouseOver(10);
    stage.enableDOMEvents(true);
    _ticker = createjs.Ticker;
    _ticker.addEventListener("tick", function(tick) {
      try {
        if (!tick.paused) {
          return stage.update();
        }
      } catch (_error) {
        _ticker.setPaused(true);
        return console.error(_error);
      }
    });
    dispatcher.on("remove:marker", function(marker) {
      return stage.removeChild(marker);
    });
    dispatcher.on("add:marker", function(marker, at) {
      return addObject(marker, at);
    });
    dispatcher.on("remove:background", function(marker) {
      return removeBackground();
    });
    addObject = function(o, at) {
      if ((stage.children[0] != null) && stage.children[0].background === true && at < 1) {
        at = 1;
      }
      if (_.isUndefined(at)) {
        return stage.addChildAt(o, at);
      } else {
        return stage.addChild(o);
      }
    };
    removeBackground = function() {
      var hasBackground, _ref;
      hasBackground = (_ref = stage.getChildAt(0)) != null ? _ref.background : void 0;
      if (hasBackground === true) {
        stage.removeChildAt(0);
        return stage.getChildAt(0).background = false;
      }
    };
    return {
      getTicker: function() {
        return _ticker;
      },
      addBackground: function(url, x, y) {
        var child, tileset;
        if (x == null) {
          x = 0;
        }
        if (y == null) {
          y = 0;
        }
        child = new createjs.Bitmap(url);
        child.x = x;
        child.y = y;
        child.background = true;
        return tileset = stage.children[0];
      },
      removeBackground: function() {
        return removeBackground();
      },
      removeChild: function(child, at) {
        if (at == null) {
          at = 0;
        }
        return stage.removeChildAt(at);
      },
      addObject: function(o, at) {
        return addObject.apply(this, arguments);
      }
    };
  });

}).call(this);
