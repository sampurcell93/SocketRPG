(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['module', 'modifiers'], function(module, modifiers) {
    var Inventory, Item, Modifier, ModifierCollection, Slots, config, get, getItem, _items, _mods, _usefns, _wearfns;
    ModifierCollection = modifiers.ModifierCollection;
    Modifier = modifiers.Modifier;
    config = module.config();
    _usefns = {
      "Phoenix Down": function(target) {
        if (!target.isDead()) {
          return target.takeDamage(5).takeDamage(-5);
        } else {
          return target;
        }
      }
    };
    _wearfns = {};
    _mods = {
      "/3": function(t, v) {
        return v / 3;
      },
      "/2": function(t, v) {
        return v / 2;
      },
      "x2": function(t, v) {
        return v * 2;
      },
      "x3": function(t, v) {
        return v * 3;
      },
      "x4": function(t, v) {
        return v * 4;
      },
      "x5": function(t, v) {
        return v * 5;
      },
      "x6": function(t, v) {
        return v * 6;
      }
    };
    Slots = (function(_super) {
      __extends(Slots, _super);

      function Slots() {
        return Slots.__super__.constructor.apply(this, arguments);
      }

      Slots.prototype.defaults = function() {
        var obj, slots;
        slots = ["head", "hands", "feet", "neck", "waist", "armor", "legs"];
        obj = {};
        _.each(slots, (function(_this) {
          return function(slot) {
            return obj[slot] = null;
          };
        })(this));
        return obj;
      };

      return Slots;

    })(Backbone.Model);
    Item = (function(_super) {
      __extends(Item, _super);

      function Item() {
        return Item.__super__.constructor.apply(this, arguments);
      }

      Item.prototype.idAttribute = 'name';

      Item.prototype.defaults = {
        action: 'minor',
        belongsTo: null,
        canEquip: false,
        canUse: true,
        equipped: false,
        level: 1,
        max_uses: 1,
        modifiers: new ModifierCollection,
        name: null,
        quantity: 1,
        ranged: false,
        role: 1,
        slot: null,
        uses: 1,
        weight: 1,
        use: function() {},
        wear: function() {}
      };

      Item.prototype.isNew = function() {
        return true;
      };

      Item.prototype.isRanged = function() {
        return this.get("ranged");
      };

      Item.prototype.initialize = function(_arg) {
        var max_uses, name;
        name = _arg.name, max_uses = _arg.max_uses;
        this.on("change:equipped", (function(_this) {
          return function(model, value) {
            if (value === true) {
              return _this.onEquip();
            } else {
              return _this.onUnEquip();
            }
          };
        })(this));
        return this.set("uses", max_uses);
      };

      Item.prototype.isEquipped = function() {
        return this.get("equipped");
      };

      Item.prototype.isEquippable = function() {
        return this.get("canEquip");
      };

      Item.prototype.onEquip = function(target) {
        if (target == null) {
          target = this.belongsTo();
        }
        target.applyModifiers(this.get("modifiers"), {
          donetext: 'Equipped ' + this.get("name")
        });
        if (board.hasState("battle")) {
          target.takeAction(this.get("action"));
        }
        return this;
      };

      Item.prototype.onUnEquip = function(target) {
        if (target == null) {
          target = this.belongsTo();
        }
        target.removeModifiers(this.get("modifiers"), {
          donetext: 'Unequipped ' + this.get("name")
        });
        return this;
      };

      Item.prototype.isUsable = function() {
        return this.get("canUse");
      };

      Item.prototype.onUse = function(target) {
        var _ref;
        if (target == null) {
          target = this.belongsTo();
        }
        if ((_ref = this.get("use")) != null) {
          _ref.call(this, target);
        }
        this.set("uses", this.get("uses") - 1);
        if (this.get("uses") === 0) {
          this.set("quantity", this.get("quantity") - 1);
          this.destroy(this.get("quantity") === 0 ? void 0 : this.set("uses", this.get("max_uses")))();
        }
        target.applyModifiers(this.get("modifiers")).takeAction(this.get("action"));
        return this;
      };

      Item.prototype.belongsTo = function(model) {
        var belongsTo;
        belongsTo = this.get("belongsTo");
        if (_.isUndefined(model)) {
          return belongsTo;
        } else {
          return _.isEqual(belongsTo, model);
        }
      };

      Item.prototype.parse = function(response) {
        modifiers = new ModifierCollection;
        _.each(response.modifiers, (function(_this) {
          return function(mod) {
            var modifier;
            if (_.isString(mod.mod)) {
              mod.mod = _mods[mod.mod];
            }
            return modifiers.add(modifier = new Modifier(mod));
          };
        })(this));
        response.modifiers = modifiers;
        return response;
      };

      return Item;

    })(Backbone.Model);
    Inventory = (function(_super) {
      __extends(Inventory, _super);

      function Inventory() {
        return Inventory.__super__.constructor.apply(this, arguments);
      }

      Inventory.prototype.model = Item;

      Inventory.prototype.type = 'Inventory';

      Inventory.prototype.url = config.items_url;

      Inventory.prototype.parse = function(resp) {
        _.each(resp, function(item) {
          item.use = _usefns[item.name] || function() {};
          return item.wear = _wearfns[item.name] || function() {};
        });
        return resp;
      };

      Inventory.prototype.comparator = function(model) {
        return -model.get("equipped");
      };

      Inventory.prototype.getTotalItems = function() {
        var sum;
        sum = 0;
        _.each(this.models, (function(_this) {
          return function(item) {
            return sum += item.get("quantity");
          };
        })(this));
        return sum;
      };

      Inventory.prototype.toJSON = function(save) {
        var arr;
        if (save == null) {
          save = false;
        }
        if (!save) {
          return Inventory.__super__.toJSON.apply(this, arguments);
        }
        arr = Inventory.__super__.toJSON.apply(this, arguments);
        _.each(arr, (function(_this) {
          return function(item) {
            var _ref;
            return item.belongsTo = (_ref = item.belongsTo) != null ? _ref.get("id") : void 0;
          };
        })(this));
        return arr;
      };

      Inventory.prototype.contains = function(item) {
        var filter, i, _i, _len, _ref;
        if (_.isString(item)) {
          filter = function(check) {
            return check.get("name") === item;
          };
        } else if (_.isObject(item)) {
          filter = function(check) {
            return check.get("name") === item.get("name");
          };
        } else if (_.isUndefined(item)) {
          throw Error("Passed an undefined item to Inventory.contains.");
        }
        _ref = this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          if (filter(i) === true) {
            return i;
          }
        }
        return null;
      };

      return Inventory;

    })(Backbone.Collection);
    _items = new Inventory;
    _items.fetch({
      success: function(coll, resp) {
        console.log(_items);
        return hub.dispatcher.dispatch("items:loaded");
      },
      error: function(coll, resp) {
        return console.error(resp);
      },
      parse: true
    });
    getItem = function(name, opts) {
      var item, quantity;
      if (opts == null) {
        opts = {};
      }
      quantity = 1;
      if (_.isObject(name)) {
        item = _items._byId[name.id];
        quantity = name.q;
      } else {
        item = _items._byId[name];
      }
      if (_.isObject(item)) {
        item = item.clone();
        item.set("quantity", quantity);
        if (opts.belongsTo) {
          item.set("belongsTo", opts.belongsTo);
        }
        return item;
      } else {
        return null;
      }
    };
    get = function(name, opts) {
      var inventory;
      if (typeof name === "string") {
        return getItem(name, opts);
      } else if (_.isArray(name)) {
        inventory = new Inventory;
        _.each(name, function(id) {
          return inventory.add(getItem(id, opts));
        });
        return inventory;
      }
    };
    return {
      get: function(name, opts) {
        if (opts == null) {
          opts = {};
        }
        return get(name, opts);
      },
      getDefaultInventory: function(opts) {
        var d;
        if (opts == null) {
          opts = {};
        }
        d = get(["Tattered Cloak", "Bread"]);
        if (opts.belongsTo && d) {
          _.each(d.models, (function(_this) {
            return function(item) {
              return item.set("belongsTo", opts.belongsTo);
            };
          })(this));
        }
        return d;
      }
    };
  });

}).call(this);
