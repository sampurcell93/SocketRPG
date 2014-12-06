(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(function() {
    var Modifier, ModifierCollection;
    Modifier = (function(_super) {
      __extends(Modifier, _super);

      function Modifier() {
        return Modifier.__super__.constructor.apply(this, arguments);
      }

      Modifier.prototype.defaults = {
        prop: null,
        mod: 0,
        turns: null,
        timing: "start",
        perm: false,
        type: 'Item',
        actsOn: null
      };

      Modifier.prototype.prop = function() {
        return this.get("prop");
      };

      Modifier.prototype.mod = function() {
        return this.get("mod");
      };

      return Modifier;

    })(Backbone.Model);
    ModifierCollection = (function(_super) {
      __extends(ModifierCollection, _super);

      function ModifierCollection() {
        return ModifierCollection.__super__.constructor.apply(this, arguments);
      }

      ModifierCollection.prototype.model = Modifier;

      return ModifierCollection;

    })(Backbone.Collection);
    return {
      Modifier: Modifier,
      ModifierCollection: ModifierCollection
    };
  });

}).call(this);
