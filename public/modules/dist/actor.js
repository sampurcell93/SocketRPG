(function() {
  define(["module", "tiler"], function(module, tiler) {
    var ActorSpawner, dispatcher, isExitingBlockBounds, resetCoordsToNewChunk, tile_dimension, _currentActor;
    dispatcher = hub.dispatcher;
    tile_dimension = tiler.getTileDimension();
    isExitingBlockBounds = function(x, y) {
      if (x < 0 || y < 0 || x > tiler.getBoardWidthPixels() - tile_dimension || y > tiler.getBoardHeightPixels() - tile_dimension) {
        return true;
      }
      return false;
    };
    resetCoordsToNewChunk = function(dx, dy) {
      if (dx === 1) {
        this.marker.x = 0;
      } else if (dx === -1) {
        this.marker.x = tiler.getBoardWidthPixels() - tile_dimension;
      }
      if (dy === 1) {
        return this.marker.y = 0;
      } else if (dy === -1) {
        return this.marker.y = tiler.getBoardHeightPixels() - tile_dimension;
      }
    };
    ActorSpawner = function() {
      return {
        spawn: function() {
          var Actor;
          Actor = Backbone.Model.extend({
            defaults: function() {
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
            },
            move: function(dx, dy, spaces) {
              var isExitingBounds, newBlockCol, newBlockRow, x, y;
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
              if (hub.states.hasState("traveling") === false && isExitingBounds === true) {
                return null;
              }
              if (isExitingBounds && hub.states.hasState("traveling")) {
                this.set("currentBlockRow", newBlockRow = this.get("currentBlockRow") + dy);
                this.set("currentBlockCol", newBlockCol = this.get("currentBlockCol") + dx);
                dispatcher.dispatch("load:map", this.get("currentStageName"), newBlockRow, newBlockCol);
                resetCoordsToNewChunk.call(this, dx, dy);
                this.currentTile = tiler.getActiveTiles().getTile(tiler.pixelToCell(y), tiler.pixelToCell(x));
                if (this.currentTile && this.currentTile.isPassableByActor(actor)) {
                  this.moving = false;
                  this.move.call(this, dx, dy, --spaces);
                }
              } else {
                this.moving = true;
                this.currentTile = tiler.getActiveTiles().getTile(tiler.pixelToCell(y), tiler.pixelToCell(x));
                if (this.currentTile && this.currentTile.isPassableByActor(actor)) {
                  this.marker.x = x;
                  this.marker.y = y;
                  this.moving = false;
                  this.move.call(this, dx, dy, --spaces);
                }
              }
              return this.moving = false;
            },
            createSprite: function() {
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
              nameobj = new createjs.Text(this.get("name"), "14px Arial", "#fff");
              this.marker.addChild(nameobj);
              dispatcher.dispatch("add:object", this.marker);
              return this;
            },
            walkopts: {
              framerate: 30,
              animations: {
                run: [0, 3]
              },
              images: ["images/sprites/hero.png"]
            },
            frames: {
              down: [[0, 0, 55, 55, 0], [55, 0, 55, 55, 0], [110, 0, 55, 55, 0], [165, 0, 55, 55, 0]],
              left: [[0, 55, 55, 55, 0], [55, 55, 55, 55, 0], [110, 55, 55, 55, 0], [165, 55, 55, 55, 0]],
              right: [[0, 110, 55, 55, 0], [55, 110, 55, 55, 0], [110, 110, 55, 55, 0], [165, 110, 55, 55, 0]],
              up: [[0, 165, 55, 55, 0], [55, 165, 55, 55, 0], [110, 165, 55, 55, 0], [165, 165, 55, 55, 0]]
            },
            initialize: function() {
              this.createSprite.call(this);
              this.active = false;
              this.currentTile = null;
              this.dead = false;
              this.defending = false;
              this.dispatched = false;
              return this.turnPhase = 0;
            },
            moveRight: function(spaces) {
              if (spaces == null) {
                spaces = 1;
              }
              return this.move(1, 0, spaces);
            },
            moveLeft: function(spaces) {
              if (spaces == null) {
                spaces = 1;
              }
              return this.move(-1, 0, spaces);
            },
            moveUp: function(spaces) {
              if (spaces == null) {
                spaces = 1;
              }
              return this.move(0, -1, spaces);
            },
            moveDown: function(spaces) {
              if (spaces == null) {
                spaces = 1;
              }
              return this.move(0, 1, spaces);
            },
            turnSprite: function(x, y) {
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
            },
            obtain: function(item, quantity) {
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
            },
            hasItem: function(item) {
              return this.get("inventory").contains(item);
            }
          });
          return new Actor();
        }
      };
    };
    _currentActor = null;
    return {
      getSpawner: function(spawnerType) {
        return new ActorSpawner();
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
