(function() {
  define(function() {
    var $canvas, canvas, stage, _ticker;
    canvas = document.getElementById("game-canvas");
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
    hub.dispatcher.on("show:stage", function() {
      return console.log(stage);
    });
    return {
      getTicker: function() {
        return _ticker;
      },
      addBackground: function(url) {
        var child;
        child = new createjs.Bitmap(url);
        child.background = true;
        return stage.addChildAt(child, 0);
      },
      removeBackground: function() {
        if (stage.getChildAt(0).background === true) {
          return stage.removeChildAt(0);
        }
      },
      addObject: function(o, at) {
        if ((stage.children[0] != null) && stage.children[0].background === true && at < 1) {
          at = 1;
        }
        if (_.isUndefined(at)) {
          return stage.addChildAt(o, at);
        } else {
          return stage.addChild(o);
        }
      }
    };
  });

}).call(this);
