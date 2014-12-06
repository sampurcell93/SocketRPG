(function() {
  define(["tiler"], function(tiler) {
    return $.getJSON("stages.json", {}, function(_stageInfo) {
      tiler.setStageInfo(_stageInfo);
      return hub.dispatcher.dispatch("loaded:assets");
    });
  });

}).call(this);
