(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['module', 'objectrenderer'], function(module, objectrenderer) {
    var Tile, TileGrid, TileGridItem, Tiles, cellToPixel, config, createEmptyBlock, dispatcher, getPathOptions, getTilesByIdentifier, maproot, pixelToCell, renderBlock, setActiveTiles, stageInfo, tileCache, _activeTileSet, _boardHeight, _boardMargin, _boardWidth;
    dispatcher = hub.dispatcher;
    config = module.config();
    _boardWidth = 19;
    _boardHeight = 14;
    _boardMargin = 40;
    tileCache = {};
    maproot = "maps/";
    stageInfo = null;
    getPathOptions = function() {
      var path_options;
      return path_options = {
        diagonal: false,
        ignoreNPCs: false,
        ignorePCs: false,
        ignoreEmpty: false,
        ignoreDifficult: false,
        storePath: true,
        ignoreDeltas: false,
        range: 6,
        handlerContext: this,
        jump: 2,
        truth_test: function(target) {
          return true;
        }
      };
    };
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

      Tile.prototype.getCellIndices = function() {
        var colCell, index, rowCell, width;
        if (this._rc && this._cc) {
          return {
            rowCell: this._rc,
            colCell: this._cc
          };
        }
        if (this.collection != null) {
          index = this.collection.indexOf(this);
          width = this.collection.width;
          this._rc = rowCell = Math.floor(index / width);
          this._cc = colCell = index % width;
          return {
            rowCell: rowCell,
            colCell: colCell
          };
        }
        return null;
      };

      Tile.prototype.isPassableByActor = function(actor, fromTile) {
        var currentHeight, height, jump;
        fromTile = fromTile || actor.currentTile;
        if (this.get("passable") === false) {
          return false;
        }
        height = this.get("elevation");
        jump = actor.get("jmp");
        currentHeight = fromTile.get("elevation");
        if (currentHeight + jump < height) {
          return false;
        }
        if (currentHeight - jump > height) {
          return false;
        }
        if (this.isOccupied()) {
          return false;
        }
        return true;
      };

      Tile.prototype.occupyWith = function(obj) {
        return this.occupiedBy = obj;
      };

      Tile.prototype.deOccupy = function() {
        return this.occupyWith(null);
      };

      Tile.prototype.isOccupied = function() {
        return !_.isNull(this.occupiedBy);
      };

      Tile.prototype.getPixelValues = function() {
        return {
          x: this.view.shape.x,
          y: this.view.shape.y
        };
      };

      Tile.prototype.getAdjacencyList = function(diagonal) {
        var a, adjacencyList, c, colCell, i, inc, rowCell, _i, _ref;
        if (diagonal == null) {
          diagonal = true;
        }
        if (diagonal === true) {
          inc = 1;
        } else {
          inc = 2;
        }
        _ref = this.getCellIndices(), rowCell = _ref.rowCell, colCell = _ref.colCell;
        adjacencyList = [];
        c = this.collection;
        for (i = _i = -1; _i <= 1; i = ++_i) {
          if (i === 0) {
            continue;
          }
          a = c.getTile(rowCell + i, colCell);
          if (a != null) {
            adjacencyList.push(a);
          }
          a = c.getTile(rowCell, colCell + i);
          if (a != null) {
            adjacencyList.push(a);
          }
          if (diagonal === true) {
            a = c.getTile(rowCell + i, colCell + -i);
            if (a != null) {
              adjacencyList.push(a);
            }
            a = c.getTile(rowCell + -i, colCell + i);
            if (a != null) {
              adjacencyList.push(a);
            }
          }
        }
        return _.sortBy(adjacencyList, function(v) {
          return v.get("difficulty");
        });
      };

      Tile.prototype.getDistanceFrom = function(row, col, shortDiagonal) {
        var colCell, dist, rowCell, xDist, yDist, _ref;
        if (shortDiagonal == null) {
          shortDiagonal = false;
        }
        _ref = this.getCellIndices(), rowCell = _ref.rowCell, colCell = _ref.colCell;
        xDist = Math.abs(colCell - col);
        yDist = Math.abs(rowCell - row);
        dist = yDist + xDist;
        if (!shortDiagonal) {
          return dist;
        } else {
          return dist - Math.min(yDist, xDist);
        }
      };

      Tile.prototype.BFS = function(lookingFor, nextTest, options) {
        var colCell, discoveryTable, finalSet, maxDistance, progenitors, queue, rowCell, start, tile, _ref;
        if (lookingFor == null) {
          lookingFor = (function() {
            return true;
          });
        }
        if (nextTest == null) {
          nextTest = (function() {
            return true;
          });
        }
        if (options == null) {
          options = {};
        }
        maxDistance = 0;
        start = this;
        start.distanceFromRoot = 0;
        options = _.extend(getPathOptions(), options);
        _ref = start.getCellIndices(), rowCell = _ref.rowCell, colCell = _ref.colCell;
        queue = [start];
        discoveryTable = {};
        progenitors = {};
        finalSet = [];
        discoveryTable[start.cid] = true;
        while (queue.length) {
          tile = queue.shift();
          if (tile !== start && lookingFor(tile, progenitors[tile.cid]) === true) {
            finalSet.push(tile);
            if (options.returnOnFirst === true) {
              break;
            }
          }
          _.each(tile.getAdjacencyList(options.diagonal), function(t) {
            var dist, r;
            r = t.getCellIndices();
            dist = tile.distanceFromRoot + t.get("difficulty");
            progenitors[t.cid] = tile;
            if (!_.has(discoveryTable, t.cid) && dist <= options.range && (nextTest(t, progenitors[t.cid]) === true || lookingFor(t, progenitors[t.cid] === true))) {
              t.distanceFromRoot = dist;
              discoveryTable[t.cid] = true;
              return queue.push(t);
            }
          });
        }
        return finalSet;
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
        if (row > this.height) {
          return null;
        } else if (col > this.width) {
          return null;
        }
        return this.at(this.width * row + col);
      };

      return Tiles;

    })(Backbone.Collection);
    TileGridItem = (function(_super) {
      __extends(TileGridItem, _super);

      function TileGridItem(url, tile) {
        TileGridItem.__super__.constructor.call(this, url);
        tile.view = this;
        this.model = tile;
        _.extend(this, Backbone.Events);
        this.listenTo(this.model, "highlight", this.drawHighlight);
      }

      TileGridItem.prototype.drawHighlight = function(color) {
        var size;
        size = this.model.get("size");
        this.shape.alpha = .5;
        return this.shape.graphics.clear().beginFill(color).drawRect(0, 0, size, size).endFill();
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
        if (x == null) {
          x = 0;
        }
        if (y == null) {
          y = 0;
        }
        size = this.model.get("size");
        x *= size;
        y *= size;
        this.graphic = new createjs.Graphics().beginStroke("black").drawRect(0, 0, size, size);
        this.shape = new createjs.Shape(this.graphic);
        this.shape.alpha = .3;
        this.shape.x = x;
        this.shape.y = y;
        this.bindHoverEvents();
        return this;
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
        var index, shape, tileRender, width;
        index = tile.collection.indexOf(tile);
        width = this.collection.width;
        tileRender = new TileGridItem("images/torch.png", tile);
        shape = tileRender.render(index % width, Math.floor(index / this.collection.width));
        return this.container.addChild(tileRender.shape);
      };

      TileGrid.prototype.render = function() {
        return this.collection.each(this.renderTile);
      };

      return TileGrid;

    })(Backbone.View);
    renderBlock = function(x, y) {
      var bg;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (!this.rendered) {
        this.gridView.render();
        this.rendered = true;
      }
      bg = new createjs.Bitmap(this.background);
      bg.x = x;
      bg.y = y;
      bg.background = true;
      return this.addChildAt(bg, 0);
    };
    createEmptyBlock = function() {
      var container, tiles;
      container = new createjs.Container();
      container.render = function(x, y) {
        return renderBlock.apply(container, arguments);
      };
      tiles = new Tiles();
      container.gridView = new TileGrid({
        collection: tiles
      });
      container.gridView.container = container;
      return container;
    };
    _activeTileSet = null;
    pixelToCell = function(pixel) {
      return Math.ceil(pixel / config.tile_dimension);
    };
    cellToPixel = function(cell) {
      return cell * tile_dimension;
    };
    getTilesByIdentifier = function(identifier, nameString, blockIndex, done) {
      var container, promise;
      if (done == null) {
        done = (function() {});
      }
      container = createEmptyBlock();
      container.background = "" + maproot + nameString + "/" + blockIndex + ".jpg";
      if (!_.has(tileCache, identifier)) {
        promise = $.getJSON(identifier, {}, function(response) {
          var tiles;
          tiles = new Tiles(response, {
            parse: true
          });
          container.tiles = tiles;
          container.gridView.collection = tiles;
          return tileCache[identifier] = container;
        });
        return promise.error(function() {
          return console.error("fucked up loading tiles from " + identifier);
        }).always(function() {
          container.tiles.nameString = nameString;
          container.tiles.blockIndex = blockIndex;
          _activeTileSet = container;
          return done(container);
        });
      } else {
        container = tileCache[identifier];
        container.tiles.nameString = nameString;
        container.tiles.blockIndex = blockIndex;
        _activeTileSet = container;
        return done(container);
      }
    };
    setActiveTiles = function(tiles) {
      objectrenderer.removeChild(null, 0);
      _activeTileSet = tiles;
      renderBlock.apply(tiles);
      return objectrenderer.addObject(tiles);
    };
    dispatcher.on("load:tiles", function(name, blockRow, blockCol, done) {
      var height, index, path, stage, width;
      if (done == null) {
        done = (function() {});
      }
      stage = stageInfo.stages[name];
      width = stage.width;
      height = stage.height;
      index = width * blockRow + blockCol;
      path = "" + maproot + name + "/" + index + ".";
      return getTilesByIdentifier("" + path + "tile", name, index, done);
    });
    dispatcher.on("load:map", function(name, blockRow, blockCol, done, type) {
      var height, index, path, stage, width;
      if (done == null) {
        done = null;
      }
      if (type == null) {
        type = 'jpg';
      }
      if (done == null) {
        done = function(tiles) {
          return setActiveTiles(tiles);
        };
      }
      stage = stageInfo.stages[name];
      width = stage.width;
      height = stage.height;
      index = width * blockRow + blockCol;
      path = "" + maproot + name + "/" + index + ".";
      if (done !== false) {
        return getTilesByIdentifier("" + path + "tile", name, index, done);
      }
    });
    return {
      getActiveTiles: function() {
        return _activeTileSet;
      },
      setActiveTiles: function(tiles) {
        return setActiveTiles(tiles);
      },
      getMapRoot: function() {
        return maproot;
      },
      Tile: Tile,
      setStageInfo: function(stageInfo_) {
        return stageInfo = stageInfo_;
      },
      getTilesByIdentifier: function(identifier) {
        return getTilesByIdentifier(identifier);
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
