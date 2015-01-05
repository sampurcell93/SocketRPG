var Backbone = require("backbone");
var _ = require("underscore");
var dispatcher = _.extend({}, Backbone.Events)
dispatcher.dispatch = dispatcher.trigger;
module.exports = dispatcher