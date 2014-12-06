define ["tiler"], (tiler) ->
    $.getJSON("stages.json", {},  (_stageInfo) ->  
        tiler.setStageInfo _stageInfo
        hub.dispatcher.dispatch("loaded:assets")
    )