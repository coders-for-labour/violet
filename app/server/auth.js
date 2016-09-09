'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file auth.js
 * @description
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var Logging = require('./logging');
var Config = require('./config');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter');

module.exports.init = app => {
  app.get('/api/auth', (req, res) => {
    res.json(req.user ? {username: req.user.username, name: req.user.name, images: req.user.images} : null);
  });

  app.get('/logout', function(req, res) {
    var returnUrl = req.query.returnUrl;
    req.logout();
    res.redirect(returnUrl ? returnUrl : '/');
  });

  app.get('/auth/twitter', (req, res, next) => {
    var returnUrl = req.query.returnUrl;
    setupPassport(returnUrl);
    var middleware = passport.authenticate('twitter');
    middleware(req, res, next);
  });

  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {failureRedirect: '/login'}),
    function(req, res) {
      // Successful authentication, redirect to return URL if present.
      var returnUrl = req.query.returnUrl;
      res.redirect(returnUrl ? returnUrl : '/');
    }
  );

  setupPassport();

  function setupPassport(returnUrl) {
    passport.use(new TwitterStrategy({
      consumerKey: Config.VIOLET_TW_CONSUMER_KEY,
      consumerSecret: Config.VIOLET_TW_CONSUMER_SECRET,
      callbackURL: `${Config.callbackDomain}/auth/twitter/callback?returnUrl=${returnUrl}`
    },
    function(token, tokenSecret, profile, cb) {
      Logging.log(profile, Logging.Constants.LogLevel.VERBOSE);
      return cb(null, {
        id: profile.id,
        token: token,
        tokenSecret: tokenSecret,
        name: profile._json.name,
        username: profile.username,
        images: {
          profile: profile._json.profile_image_url,
          banner: profile._json.profile_banner_url
        }
      });
    }));
  }

  passport.serializeUser((user, done) => {
    // Logging.log("serialise");
    // Logging.log(user);
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    // Logging.log("deserialise");
    // Logging.log(user);
    done(null, user);
  });
};
