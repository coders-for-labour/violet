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
var rhizome = require('./rhizome').instance();

module.exports.init = app => {
  app.get('/api/auth', (req, res) => {
    res.json(req.user ? {username: req.user.username, name: req.user.name, images: req.user.images} : null);
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/auth/twitter',
    passport.authenticate('twitter')
  );

  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {failureRedirect: '/login'}),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    }
  );

  passport.use(new TwitterStrategy({
    consumerKey: Config.VIOLET_TW_CONSUMER_KEY,
    consumerSecret: Config.VIOLET_TW_CONSUMER_SECRET,
    callbackURL: `${Config.callbackDomain}/auth/twitter/callback`
  },
  function(token, tokenSecret, profile, cb) {
    Logging.log(profile, Logging.Constants.LogLevel.DEBUG);

    var user = {
      app: 'twitter',
      id: profile.id,
      token: token,
      tokenSecret: tokenSecret,
      name: profile._json.name,
      username: profile.username,
      profileUrl: `https://twitter.com/${profile.username}`,
      profileImgUrl: profile._json.profile_image_url,
      bannerImgUrl: profile._json.profile_banner_url
    };
    Logging.log(user, Logging.Constants.LogLevel.DEBUG);
    rhizome.findOrCreateUser(user).then(rhizomeUser => cb(null, rhizomeUser));
  }));

  passport.serializeUser((user, done) => {
    Logging.log('Auth Serialise User', Logging.Constants.LogLevel.VERBOSE);
    Logging.log(user, Logging.Constants.LogLevel.DEBUG);
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    Logging.log('Auth Deserialise User', Logging.Constants.LogLevel.VERBOSE);
    Logging.log(user, Logging.Constants.LogLevel.DEBUG);
    done(null, user);
  });
};
