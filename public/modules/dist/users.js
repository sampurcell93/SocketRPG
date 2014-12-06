(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['actor'], function(actors) {
    var Loader, SignUp, SingleUserForLoading, User;
    User = (function(_super) {
      __extends(User, _super);

      function User() {
        return User.__super__.constructor.apply(this, arguments);
      }

      User.prototype.idAttribute = '_id';

      return User;

    })(Backbone.Model);
    SingleUserForLoading = (function(_super) {
      __extends(SingleUserForLoading, _super);

      function SingleUserForLoading() {
        return SingleUserForLoading.__super__.constructor.apply(this, arguments);
      }

      SingleUserForLoading.prototype.template = "<%= username %>";

      SingleUserForLoading.prototype.tagName = "li";

      SingleUserForLoading.prototype.className = 'single-user-for-loading';

      SingleUserForLoading.prototype.render = function() {
        this.$el.html(_.template(this.template, this.model.toJSON()));
        return this;
      };

      SingleUserForLoading.prototype.events = {
        "click": function() {
          var promise, user;
          user = new User({
            username: this.model.get("username")
          });
          promise = _user.fetch({
            parse: true
          });
          return promise.success = function() {
            return console.log("fetched user", _user);
          };
        }
      };

      return SingleUserForLoading;

    })(Backbone.View);
    Loader = (function(_super) {
      __extends(Loader, _super);

      function Loader() {
        return Loader.__super__.constructor.apply(this, arguments);
      }

      Loader.prototype.el = "#load-game";

      Loader.prototype.initialize = function(_arg) {
        this.username = _arg.username;
        return _.bindAll(this, "addUser");
      };

      Loader.prototype.addUser = function(user) {
        this.$("ul").append(new SingleUserForLoading({
          model: user
        }).render().el);
        return this;
      };

      Loader.prototype.render = function() {
        this.collection.each(this.addUser);
        this.$el.removeClass("hidden");
        return this;
      };

      return Loader;

    })(Backbone.View);
    return SignUp = (function(_super) {
      __extends(SignUp, _super);

      function SignUp() {
        return SignUp.__super__.constructor.apply(this, arguments);
      }

      SignUp.prototype.template = $("#new-game").html();

      SignUp.prototype.render = function() {
        var template;
        template = _.template(this.template);
        this.$el.html(template());
        return this;
      };

      SignUp.prototype.events = function() {
        return {
          "click .js-start-game": function() {
            var user;
            user = new User({
              username: 'Sams',
              password: 'Sampass'
            });
            return _user.save(null, {
              success: (function(_this) {
                return function(u, resp) {
                  return console.log("created new user");
                };
              })(this)
            });
          }
        };
      };

      return SignUp;

    })(Backbone.View);
  });

}).call(this);
