(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["socket"], function(io) {
    var Pool, PoolListItem, PoolListView, Pools, activePools, addFreePlayer, getActivePools;
    Pool = (function(_super) {
      __extends(Pool, _super);

      function Pool() {
        return Pool.__super__.constructor.apply(this, arguments);
      }

      Pool.prototype.parse = function(response) {
        response.created_at = new Date(response.created_at);
        return response;
      };

      return Pool;

    })(Backbone.Model);
    Pools = (function(_super) {
      __extends(Pools, _super);

      function Pools() {
        return Pools.__super__.constructor.apply(this, arguments);
      }

      Pools.prototype.model = Pool;

      Pools.prototype.url = function() {
        return "/pools";
      };

      return Pools;

    })(Backbone.Collection);
    activePools = null;
    getActivePools = function(done) {
      if (done == null) {
        done = function() {};
      }
      if (activePools == null) {
        activePools = new Pools();
        return activePools.fetch().success(function() {
          console.log(activePools);
          return done(activePools);
        });
      } else {
        return done(activePools);
      }
    };
    addFreePlayer = function(playerID) {};
    PoolListItem = (function(_super) {
      __extends(PoolListItem, _super);

      function PoolListItem() {
        return PoolListItem.__super__.constructor.apply(this, arguments);
      }

      PoolListItem.prototype.template = "#pool-list-item";

      PoolListItem.prototype.tagName = 'li';

      PoolListItem.prototype.events = {
        "click .js-join-pool": function() {
          return this.model.join();
        }
      };

      return PoolListItem;

    })(Marionette.ItemView);
    PoolListView = (function(_super) {
      __extends(PoolListView, _super);

      function PoolListView() {
        return PoolListView.__super__.constructor.apply(this, arguments);
      }

      PoolListView.prototype.childView = PoolListItem;

      PoolListView.prototype.el = "#active-pools";

      return PoolListView;

    })(Marionette.CollectionView);
    return {
      getActivePools: function() {
        return getActivePools.apply(this, arguments);
      },
      addPlayerToPool: function(playerID, poolID) {
        var _ref;
        return (_ref = activePools._byId) != null ? _ref.addPlayer(playerID) : void 0;
      },
      addFreePlayer: function(playerID) {
        return addFreePlayer.apply(this, arguments);
      },
      getPoolsView: function(collection, opts) {
        return new PoolListView({
          collection: collection
        }, opts);
      }
    };
  });

}).call(this);
