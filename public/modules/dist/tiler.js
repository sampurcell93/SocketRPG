(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['module', 'objectrenderer'], function(module, objectrenderer) {
    var Tile, TileGrid, TileGridItem, Tiles, cellToPixel, config, dispatcher, initializeEmptyTileSet, maproot, pixelToCell, setActiveTiles, stageInfo, t, tileCache, _activeTileSet, _boardHeight, _boardMargin, _boardWidth;
    dispatcher = hub.dispatcher;
    config = module.config();
    _boardWidth = 19;
    _boardHeight = 14;
    _boardMargin = 40;
    tileCache = {};
    maproot = "maps/";
    stageInfo = null;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile() {
        return Tile.__super__.constructor.apply(this, arguments);
      }

      Tile.prototype.defaults = function() {
        return {
          size: config.tile_dimension,
          difficulty: 1,
          elevation: 0,
          passable: true
        };
      };

      Tile.prototype.initialize = function() {
        return this.occupiedBy = null;
      };

      Tile.prototype.isPassableByActor = function(actor) {
        return this.get("passable");
      };

      Tile.prototype.occupyWith = function(obj) {
        return this.occupiedBy = obj;
      };

      Tile.prototype.isOccupied = function() {
        return !_.isNull(this.occupiedBy);
      };

      return Tile;

    })(Backbone.Model);
    Tiles = (function(_super) {
      __extends(Tiles, _super);

      function Tiles() {
        return Tiles.__super__.constructor.apply(this, arguments);
      }

      Tiles.prototype.model = Tile;

      Tiles.prototype.initialize = function() {
        this.width = _boardWidth;
        return this.height = _boardHeight;
      };

      Tiles.prototype.getTile = function(row, col) {
        return this.at(this.width * row + col);
      };

      return Tiles;

    })(Backbone.Collection);
    TileGridItem = (function(_super) {
      __extends(TileGridItem, _super);

      function TileGridItem() {
        TileGridItem.__super__.constructor.apply(this, arguments);
      }

      TileGridItem.prototype.initialize = function() {
        return this.model.view = this;
      };

      TileGridItem.prototype.bindHoverEvents = function() {
        var hit, size;
        size = this.model.get("size");
        hit = new createjs.Shape();
        hit.graphics.beginFill("#000").beginStroke(1).drawRect(0, 0, size, size);
        return this.shape.hitArea = hit;
      };

      TileGridItem.prototype.render = function(x, y) {
        var size;
        size = this.model.get("size");
        x *= size;
        y *= size;
        this.graphic = new createjs.Graphics().beginStroke("black").drawRect(0, 0, size, size);
        this.shape = new createjs.Shape(this.graphic);
        this.shape.alpha = .3;
        this.shape.x = x;
        this.shape.y = y;
        this.bindHoverEvents();
        objectrenderer.addObject(this.shape);
        return this.shape;
      };

      return TileGridItem;

    })(createjs.Bitmap);
    TileGrid = (function(_super) {
      __extends(TileGrid, _super);

      function TileGrid() {
        return TileGrid.__super__.constructor.apply(this, arguments);
      }

      TileGrid.prototype.initialize = function() {
        return _.bindAll(this, "renderTile");
      };

      TileGrid.prototype.renderTile = function(tile) {
        var index, tileRender, width;
        index = tile.collection.indexOf(tile);
        width = this.collection.width;
        tileRender = new TileGridItem();
        tileRender.model = tile;
        return tileRender.render(index % width, Math.floor(index / this.collection.width));
      };

      TileGrid.prototype.render = function() {
        return this.collection.each(this.renderTile);
      };

      return TileGrid;

    })(Backbone.View);
    _activeTileSet = null;
    initializeEmptyTileSet = function() {
      var i, _i, _ref;
      _activeTileSet = new Tiles();
      for (i = _i = 0, _ref = _boardHeight * _boardWidth; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _activeTileSet.add(new Tile);
      }
      return _activeTileSet;
    };
    initializeEmptyTileSet();
    t = new TileGrid({
      collection: _activeTileSet
    });
    t.render();
    pixelToCell = function(pixel) {
      return Math.ceil(pixel / config.tile_dimension);
    };
    cellToPixel = function(cell) {
      return cell * tile_dimension;
    };
    setActiveTiles = function(identifier, nameString, blockIndex) {
      var promise;
      if (!_.has(tileCache, identifier)) {
        promise = $.getJSON(identifier, {}, function(tiles) {
          tiles = new Tiles(tiles, {
            parse: true
          });
          tileCache[identifier] = tiles;
          return _activeTileSet = tiles;
        });
        return promise.error(function() {
          console.error("fucked up loading tiles from " + identifier);
          return _activeTileSet = initializeEmptyTileSet();
        }).always(function() {
          _activeTileSet.nameString = nameString;
          return _activeTileSet.blockIndex = blockIndex;
        });
      } else {
        _activeTileSet = tileCache[identifier];
        _activeTileSet.nameString = nameString;
        return _activeTileSet.blockIndex = blockIndex;
      }
    };
    dispatcher.on("load:map", function(name, blockRow, blockCol, type) {
      var height, index, path, stage, width;
      if (type == null) {
        type = 'jpg';
      }
      stage = stageInfo.stages[name];
      width = stage.width;
      height = stage.height;
      index = width * blockRow + blockCol;
      objectrenderer.removeBackground();
      path = "" + maproot + name + "/" + index + ".";
      objectrenderer.addBackground("" + path + type);
      setActiveTiles("" + path + "tile", name, index);
      return dispatcher.dispatch("toggle:mapmaker");
    });
    return {
      getMapRoot: function() {
        return maproot;
      },
      Tile: Tile,
      setStageInfo: function(stageInfo_) {
        return stageInfo = stageInfo_;
      },
      getActiveTiles: function() {
        return _activeTileSet;
      },
      setActiveTiles: function(identifier) {
        return setActiveTiles(identifier);
      },
      pixelToCell: function(pixel) {
        return pixelToCell(pixel);
      },
      cellToPixel: function(pixel) {
        return cellToPixel(cell);
      },
      getBoardWidthCells: function() {
        return _boardWidth;
      },
      getBoardHeightCells: function() {
        return _boardHeight;
      },
      getBoardHeightPixels: function() {
        return _boardHeight * config.tile_dimension;
      },
      getBoardWidthPixels: function() {
        return _boardWidth * config.tile_dimension;
      },
      getTileDimension: function() {
        return config.tile_dimension;
      },
      tileEntryFunctions: {
        l: function(x, y) {
          return x > 0;
        },
        r: function(x, y) {
          return x < 0;
        },
        t: function(x, y) {
          return y > 0;
        },
        b: function(x, y) {
          return y < 0;
        },
        rl: function(x, y) {
          return l(x, y) || r(x, y);
        },
        tl: function(x, y) {
          return l(x, y) || t(x, y);
        },
        bl: function(x, y) {
          return l(x, y) || b(x, y);
        },
        trl: function(x, y) {
          return tr(x, y) || l(x, y);
        },
        tbl: function(x, y) {
          return bl(x, y) || t(x, y);
        },
        rbl: function(x, y) {
          return l(x, y) || rb(x, y);
        },
        tr: function(x, y) {
          return r(x, y) || t(x, y);
        },
        rb: function(x, y) {
          return r(x, y) || b(x, y);
        },
        trb: function(x, y) {
          return tr(x, y) || b(x, y);
        },
        tb: function(x, y) {
          return b(x, y) || t(x, y);
        },
        e: function() {
          return true;
        }
      }
    };
  });

}).call(this);
