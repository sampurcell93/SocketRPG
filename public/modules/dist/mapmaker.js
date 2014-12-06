(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['tiler'], function(tiler) {
    var EditableGrid, EditableGridItem, dispatcher, grid, parseBool, root, tileEditor;
    root = tiler.getMapRoot();
    parseBool = function(str) {
      str = str.toLowerCase();
      if (str === "true") {
        return true;
      } else if (str === "false") {
        return false;
      } else {
        return str;
      }
    };
    tileEditor = (function(_super) {
      __extends(tileEditor, _super);

      function tileEditor() {
        return tileEditor.__super__.constructor.apply(this, arguments);
      }

      tileEditor.prototype.el = "#tile-editor";

      tileEditor.prototype.singleTemplate = $("#single-tile-editor-template").html();

      tileEditor.prototype.groupTemplate = $("#group-tile-editor-template").html();

      tileEditor.prototype.updateSelectedTilesFromDOMInputs = function() {
        var attrs;
        attrs = [
          {
            name: 'difficulty'
          }, {
            name: "elevation"
          }, {
            name: 'passable'
          }
        ];
        _.each(attrs, (function(_this) {
          return function(val, key) {
            var inputval, parsed_input;
            inputval = _this.$(".val-" + val.name).val();
            if (!inputval) {
              return true;
            }
            attrs[key].value = inputval;
            parsed_input = parseBool(attrs[key].value);
            if (typeof parsed_input === "boolean") {
              attrs[key].value = parsed_input;
            }
            parsed_input = parseInt(attrs[key].value);
            if (typeof parsed_input === "number" && !_.isNaN(parsed_input)) {
              return attrs[key].value = parsed_input;
            }
          };
        })(this));
        return _.each(this.tiles, (function(_this) {
          return function(tile) {
            return _.each(attrs, function(attr) {
              return tile.set(attr.name, attr.value);
            });
          };
        })(this));
      };

      tileEditor.prototype.events = {
        'click .js-save-map': function() {
          var promise, tiles;
          tiles = grid.collection;
          this.updateSelectedTilesFromDOMInputs();
          tiles.url = "/mapping/" + tiles.nameString + "/" + tiles.blockIndex;
          promise = tiles.sync("create", tiles, {
            success: (function(_this) {
              return function() {
                return console.log("success");
              };
            })(this),
            error: function() {
              return console.log("error");
            }
          });
          return promise.always((function(_this) {
            return function() {
              return _this.$el.off('click', '.js-save-map');
            };
          })(this));
        }
      };

      tileEditor.prototype.render = function() {
        var template;
        if (this.tiles.length === 1) {
          template = _.template(this.singleTemplate);
          return this.$el.html(template(this.tiles[0].toJSON())).show();
        } else {
          template = _.template(this.groupTemplate);
          return this.$el.html(template({
            numtiles: this.tiles.length
          })).show();
        }
      };

      return tileEditor;

    })(Backbone.View);
    EditableGridItem = (function(_super) {
      __extends(EditableGridItem, _super);

      function EditableGridItem() {
        return EditableGridItem.__super__.constructor.apply(this, arguments);
      }

      EditableGridItem.prototype.model = tiler.Tile;

      EditableGridItem.prototype.tagName = 'li';

      EditableGridItem.prototype.template = "#grid-item";

      EditableGridItem.prototype.className = 'grid-item';

      EditableGridItem.prototype.initialize = function(attrs) {
        return this.listenTo(attrs.model, {
          "all": (function(_this) {
            return function(attr, model, newval) {
              var val;
              if (attr.indexOf("change") !== -1) {
                val = attr.split(":")[1];
                return _this.$("." + val).text(newval);
              }
            };
          })(this)
        });
      };

      return EditableGridItem;

    })(Marionette.ItemView);
    EditableGrid = (function(_super) {
      __extends(EditableGrid, _super);

      function EditableGrid() {
        return EditableGrid.__super__.constructor.apply(this, arguments);
      }

      EditableGrid.prototype.childView = EditableGridItem;

      EditableGrid.prototype.el = '.mapmaker-grid';

      EditableGrid.prototype.showing = false;

      EditableGrid.prototype.hide = function() {
        this.showing = false;
        return this.$el.hide();
      };

      EditableGrid.prototype.show = function() {
        this.showing = true;
        return this.$el.show();
      };

      EditableGrid.prototype.toggle = function() {
        if (this.showing) {
          return this.hide();
        } else {
          return this.show();
        }
      };

      EditableGrid.prototype.beforeRender = function() {
        return this.$el.empty();
      };

      EditableGrid.prototype.onRender = function() {
        return this.$el.selectable({
          appendTo: '.mapmaker-grid',
          filter: 'li.grid-item',
          start: (function(_this) {
            return function() {
              return _this.selected = {};
            };
          })(this),
          selected: (function(_this) {
            return function(e, ui) {
              var sel;
              sel = ui.selected;
              return _this.selected[$(sel).index()] = sel;
            };
          })(this),
          stop: (function(_this) {
            return function(e, ui) {
              var editor, selected_tiles, width;
              width = _this.collection.width;
              selected_tiles = [];
              _.each(_this.selected, function(val, i) {
                return selected_tiles.push(_this.collection.at(i));
              });
              editor = new tileEditor();
              editor.tiles = selected_tiles;
              console.log(selected_tiles.length);
              return editor.render();
            };
          })(this)
        });
      };

      return EditableGrid;

    })(Marionette.CollectionView);
    dispatcher = hub.dispatcher;
    grid = new EditableGrid();
    return dispatcher.on("toggle:mapmaker", function() {
      var active_map;
      active_map = tiler.getActiveTiles();
      console.log(active_map);
      grid.collection = active_map;
      grid.render();
      return grid.toggle();
    });
  });

}).call(this);
