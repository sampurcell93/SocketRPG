(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(function() {
    var Console, Line, Message, Messages, activity, handleEvent, _console, _events;
    _events = hub.dispatcher;
    Message = (function(_super) {
      __extends(Message, _super);

      function Message() {
        return Message.__super__.constructor.apply(this, arguments);
      }

      Message.prototype.defaults = function() {
        return {
          text: "Message!"
        };
      };

      return Message;

    })(Backbone.Model);
    Messages = (function(_super) {
      __extends(Messages, _super);

      function Messages() {
        return Messages.__super__.constructor.apply(this, arguments);
      }

      Messages.prototype.model = Message;

      return Messages;

    })(Backbone.Collection);
    Line = (function(_super) {
      __extends(Line, _super);

      function Line() {
        return Line.__super__.constructor.apply(this, arguments);
      }

      Line.prototype.tagName = 'li';

      Line.prototype.template = "<%= text %>";

      Line.prototype.initialize = function() {
        return this.listenTo(this.model, {
          "destroy": function() {
            return this.$el.text("");
          }
        });
      };

      Line.prototype.render = function() {
        var template;
        template = _.template(this.template);
        this.$el.html(template(this.model.toJSON()));
        return this;
      };

      return Line;

    })(Backbone.View);
    Console = (function(_super) {
      __extends(Console, _super);

      function Console() {
        return Console.__super__.constructor.apply(this, arguments);
      }

      Console.prototype.el = '.game-console';

      Console.prototype.msgLen = 5;

      Console.prototype.visible = true;

      Console.prototype.initialize = function() {
        this.listenTo(this.collection, {
          "add": this.emit
        });
        return this.hide();
      };

      Console.prototype.trimOldMessages = function() {
        var diff, to_prune;
        if (this.collection.length > this.msgLen) {
          diff = this.collection.length - this.msgLen;
          to_prune = this.collection.slice(0, diff);
          while (to_prune.length) {
            to_prune.shift().destroy();
          }
        }
        return this;
      };

      Console.prototype.scrollToBottom = function(speed) {
        if (speed == null) {
          speed = "fast";
        }
        return this.$("ol").animate({
          scrollTop: this.$("ol")[0].scrollHeight
        }, speed);
      };

      Console.prototype.emit = function(model) {
        var $el, line;
        line = new Line({
          model: model
        });
        $el = this.$el;
        this.$("ol").append(line.render().el);
        this.trimOldMessages();
        return this.scrollToBottom();
      };

      Console.prototype.show = function() {
        this.visible = true;
        this.$el.removeClass("hidden");
        this.scrollToBottom(0);
        return this;
      };

      Console.prototype.hide = function() {
        this.visible = false;
        this.$el.addClass("hidden");
        return this;
      };

      Console.prototype.toggle = function() {
        if (this.visible) {
          return this.hide();
        } else {
          return this.show();
        }
      };

      Console.prototype.events = {
        "click .js-toggle": "toggle",
        "dblclick": "hide"
      };

      return Console;

    })(Backbone.View);
    _console = new Console({
      collection: new Messages
    });
    handleEvent = function(type) {
      type = type.split(":");
      switch (type[0]) {
        case "state":
          return activity.emit("State changed to " + type[1]);
        case "items":
          return activity.emit("Items were " + type[1]);
        case "powers":
          return activity.emit("Powers were " + type[1]);
        case "menu":
          break;
        case "battle":
          if (type[1] === "timerdone") {
            return activity.emit("" + (arguments[1].get('name')) + " failed to act, and lost an action");
          }
          break;
        case "game":
          return activity.emit("Game " + type[1] + " loaded");
        default:
          return activity.emit(type.join(":"));
      }
    };
    _events.on("all", handleEvent);
    return activity = {
      emit: (function(_this) {
        return function(message, opts) {
          return _console.collection.add(new Message(_.extend({
            text: message
          }, opts)));
        };
      })(this),
      hide: function() {
        return _console.hide();
      },
      show: function() {
        return _console.show();
      },
      toggle: function() {
        return _console.toggle();
      }
    };
  });

}).call(this);
