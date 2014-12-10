(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["module", "tiler"], function(module, tiler) {
    var Actor, Spawner, SpawnerView, dispatcher, getNewChunkCoords, isExitingBlockBounds, tile_dimension, _currentActor;
    dispatcher = hub.dispatcher;
    tile_dimension = tiler.getTileDimension();
    _currentActor = null;
    isExitingBlockBounds = function(x, y) {
      if (x < 0 || y < 0 || x > tiler.getBoardWidthPixels() - tile_dimension || y > tiler.getBoardHeightPixels() - tile_dimension) {
        return true;
      }
      return false;
    };
    getNewChunkCoords = function(dx, dy) {
      var x, y;
      x = this.marker.x;
      y = this.marker.y;
      if (dx === 1) {
        x = 0;
      } else if (dx === -1) {
        x = tiler.getBoardWidthPixels() - tile_dimension;
      }
      if (dy === 1) {
        y = 0;
      } else if (dy === -1) {
        y = tiler.getBoardHeightPixels() - tile_dimension;
      }
      return {
        x: x,
        y: y
      };
    };
    Actor = (function(_super) {
      __extends(Actor, _super);

      function Actor() {
        return Actor.__super__.constructor.apply(this, arguments);
      }

      Actor.prototype.defaults = function() {
        return {
          AC: 10,
          atk: 1,
          currentStage: 0,
          currentStageName: 'Home',
          currentBlockRow: 0,
          currentBlockCol: 0,
          carryingCapacity: 100,
          eco: 10,
          maxEco: 10,
          HP: 100,
          maxHP: 100,
          init: 1,
          jmp: 1,
          level: 1,
          name: "Actor",
          path: 'peasant',
          race: 'Human',
          range: 1,
          regY: 0,
          type: 'NPC',
          spd: 5,
          spriteimg: "images/hero.png",
          XP: 0
        };
      };

      Actor.prototype.move = function(dx, dy, spaces) {
        var currentStageName, isExitingBounds, newBlockCol, newBlockRow, targetTile, x, y;
        if (spaces == null) {
          spaces = 1;
        }
        if (this.moving === true) {
          return null;
        }
        if (spaces < 1) {
          return null;
        }
        x = this.marker.x + dx * tile_dimension;
        y = this.marker.y + dy * tile_dimension;
        this.turnSprite(dx, dy);
        isExitingBounds = isExitingBlockBounds(x, y);
        currentStageName = this.get("currentStageName");
        if (hub.states.hasState("traveling") === false && isExitingBounds === true) {
          return null;
        }
        if (isExitingBounds && hub.states.hasState("traveling")) {
          newBlockRow = this.get("currentBlockRow") + dy;
          newBlockCol = this.get("currentBlockCol") + dx;
          dispatcher.dispatch("load:tiles", currentStageName, newBlockRow, newBlockCol, (function(_this) {
            return function(activeTiles) {
              var targetTile, _ref;
              _ref = getNewChunkCoords.call(_this, dx, dy), x = _ref.x, y = _ref.y;
              targetTile = activeTiles.getTile(tiler.pixelToCell(y), tiler.pixelToCell(x));
              if (targetTile && targetTile.isPassableByActor(actor)) {
                tiler.setActiveTiles(activeTiles);
                _this.set("currentBlockRow", newBlockRow);
                _this.set("currentBlockCol", newBlockCol);
                dispatcher.dispatch("load:map", currentStageName, newBlockRow, newBlockCol, false);
                _this.marker.x = x;
                _this.marker.y = y;
                _this.setCurrentTile(targetTile);
                _this.moving = false;
                _this.move.call(_this, dx, dy, --spaces);
              }
              return _this.moving = false;
            };
          })(this));
        } else {
          this.moving = true;
          targetTile = tiler.getActiveTiles().getTile(tiler.pixelToCell(y), tiler.pixelToCell(x));
          if (targetTile && targetTile.isPassableByActor(actor)) {
            this.setCurrentTile(targetTile);
            this.marker.x = x;
            this.marker.y = y;
            this.moving = false;
            this.move.call(this, dx, dy, --spaces);
          }
        }
        return this.moving = false;
      };

      Actor.prototype.createSprite = function() {
        var nameobj, sheet, sprite;
        this.walkopts = _.extend(this.walkopts, {
          images: [this.get("spriteimg")]
        });
        this.sheets = {
          "-1,0": new createjs.SpriteSheet(_.extend(this.walkopts, {
            frames: this.frames.left
          })),
          "1,0": new createjs.SpriteSheet(_.extend(this.walkopts, {
            frames: this.frames.right
          })),
          "0,-1": new createjs.SpriteSheet(_.extend(this.walkopts, {
            frames: this.frames.up
          })),
          "0,1": new createjs.SpriteSheet(_.extend(this.walkopts, {
            frames: this.frames.down
          }))
        };
        sheet = this.sheets["0,1"];
        sheet.getAnimation("run").speed = .13;
        sheet.getAnimation("run").next = "run";
        sprite = new createjs.Sprite(sheet, "run");
        this.marker = new createjs.Container();
        this.marker.regY = this.get("regY");
        this.marker.addChild(sprite);
        this.marker.icon = sprite;
        this.marker.type = "Actor";
        nameobj = new createjs.Text(this.get("name"), "14px Arial", "#fff");
        this.marker.addChild(nameobj);
        dispatcher.dispatch("add:object", this.marker);
        return this;
      };

      Actor.prototype.walkopts = {
        framerate: 30,
        animations: {
          run: [0, 3]
        },
        images: ["images/sprites/hero.png"]
      };

      Actor.prototype.frames = {
        down: [[0, 0, 55, 55, 0], [55, 0, 55, 55, 0], [110, 0, 55, 55, 0], [165, 0, 55, 55, 0]],
        left: [[0, 55, 55, 55, 0], [55, 55, 55, 55, 0], [110, 55, 55, 55, 0], [165, 55, 55, 55, 0]],
        right: [[0, 110, 55, 55, 0], [55, 110, 55, 55, 0], [110, 110, 55, 55, 0], [165, 110, 55, 55, 0]],
        up: [[0, 165, 55, 55, 0], [55, 165, 55, 55, 0], [110, 165, 55, 55, 0], [165, 165, 55, 55, 0]]
      };

      Actor.prototype.initialize = function() {
        this.createSprite.call(this);
        this.active = false;
        this.currentTile = null;
        this.dead = false;
        this.defending = false;
        this.dispatched = false;
        return this.turnPhase = 0;
      };

      Actor.prototype.moveRight = function(spaces) {
        if (spaces == null) {
          spaces = 1;
        }
        return this.move(1, 0, spaces);
      };

      Actor.prototype.moveLeft = function(spaces) {
        if (spaces == null) {
          spaces = 1;
        }
        return this.move(-1, 0, spaces);
      };

      Actor.prototype.moveUp = function(spaces) {
        if (spaces == null) {
          spaces = 1;
        }
        return this.move(0, -1, spaces);
      };

      Actor.prototype.moveDown = function(spaces) {
        if (spaces == null) {
          spaces = 1;
        }
        return this.move(0, 1, spaces);
      };

      Actor.prototype.turnSprite = function(x, y) {
        var sheet;
        if (x !== 0 && y !== 0) {
          x = 0;
        }
        sheet = this.sheets[x + "," + y];
        sheet.getAnimation("run").speed = .13;
        if (!sheet) {
          alert("FUCKED UP IN TURN");
        }
        return this.marker.icon.spriteSheet = sheet;
      };

      Actor.prototype.obtain = function(item, quantity) {
        var existing;
        if (quantity == null) {
          quantity = 1;
        }
        existing = this.hasItem(item);
        if (existing) {
          quantity += existing.get("quantity");
          item = existing;
        }
        item.set("quantity", quantity);
        item.set("belongsTo", this);
        item.set("equipped", false);
        this.get("inventory").add(item);
        return this;
      };

      Actor.prototype.hasItem = function(item) {
        return this.get("inventory").contains(item);
      };

      Actor.prototype.setCurrentTile = function(tile, moveTo) {
        var x, y, _ref;
        if (tile == null) {
          tile = null;
        }
        if (moveTo == null) {
          moveTo = false;
        }
        if ((this.currentTile != null)) {
          this.currentTile.deOccupy();
        }
        this.currentTile = tile;
        if ((tile != null) && moveTo) {
          _ref = tile.getPixelValues(), x = _ref.x, y = _ref.y;
          this.marker.x = x;
          this.marker.y = y;
          return tile.occupyWith(this);
        }
      };

      return Actor;

    })(Backbone.Model);
    Spawner = (function() {
      function Spawner(spawnerAction) {
        this.spawnerAction = spawnerAction != null ? spawnerAction : function() {
          return new Actor;
        };
      }

      Spawner.prototype.spawn = function() {
        return this.spawnerAction();
      };

      return Spawner;

    })();
    SpawnerView = (function() {
      SpawnerView.prototype.visible = false;

      function SpawnerView(spawner, x, y) {
        var base, col, row, spritesheet, target;
        if (x == null) {
          x = 100;
        }
        if (y == null) {
          y = 350;
        }
        spritesheet = {
          framerate: 100,
          animations: {
            pulse: [0, 7]
          },
          frames: [[0, 0, 50, 57], [50, 0, 50, 57], [100, 0, 50, 57], [150, 0, 50, 57], [150, 0, 50, 57], [100, 0, 50, 57], [50, 0, 50, 57], [0, 0, 50, 57]]
        };
        base = new createjs.SpriteSheet(_.extend(spritesheet, {
          images: ["images/dispatchbase.png"]
        }));
        base.getAnimation("pulse").speed = .25;
        base.getAnimation("pulse").next = "pulse";
        this.marker = new createjs.Container();
        this.marker.addChild(base = new createjs.Sprite(base, "pulse"));
        base.y = 20;
        this.marker.x = x;
        this.marker.y = y;
        col = tiler.pixelToCell(x);
        row = tiler.pixelToCell(y);
        target = tiler.getActiveTiles().getTile(row, col);
        target.occupyWith(this);
        this.currentTile = target;
        console.log(this.currentTile);
        this.marker.regY = 7;
        this.bindEvents();
        this;
      }

      SpawnerView.prototype.showDispatchMenu = function() {
        return this;
      };

      SpawnerView.prototype.bindEvents = function() {
        this.marker.on("click", this.showDispatchMenu, false, this);
        return this;
      };

      SpawnerView.prototype.show = function() {
        this.visible = true;
        dispatcher.dispatch("add:marker", this.marker);
        return this;
      };

      SpawnerView.prototype.hide = function() {
        this.visible = false;
        dispatcher.dispatch("remove:marker", this.marker);
        return this;
      };

      SpawnerView.prototype.addChild = function(marker) {
        return this.marker.addChild(marker);
      };

      SpawnerView.prototype.removeChild = function(id) {
        return this.marker.removeChild(id);
      };

      SpawnerView.prototype.getX = function() {
        return this.marker.x;
      };

      SpawnerView.prototype.getY = function() {
        return this.marker.y;
      };

      SpawnerView.prototype.canDispatch = function() {
        return !this.currentTile.isOccupied();
      };

      return SpawnerView;

    })();
    return {
      getSpawner: function(spawnerType) {
        return new Spawner(spawnerType);
      },
      getSpawnerView: function(x, y, spawner) {
        return new SpawnerView(spawner, x, y);
      },
      setCurrentActor: function(actor) {
        return _currentActor = actor;
      },
      getCurrentActor: function() {
        return _currentActor;
      }
    };
  });

}).call(this);
