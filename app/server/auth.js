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

module.exports.init = (app) => {
  app.get('/api/v1/auth', (req, res) => {
    res.json(req.user ? {username: req.user.username, name: req.user.name, images: req.user.images} : false);
  });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/auth/twitter',
    passport.authenticate('twitter')
  );

  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    }
  );

  passport.use(new TwitterStrategy({
      consumerKey: Config.VIOLET_TW_CONSUMER_KEY,
      consumerSecret: Config.VIOLET_TW_CONSUMER_SECRET,
      callbackURL: "http://dev.violet.com/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, cb) {
      // Logging.log(profile);
      // Logging.log(profile);
      // User.findOrCreate({ twitterId: profile.id }, function (err, user) {
      //   return cb(err, user);
      // });
      return cb(null,{
        id:profile.id,
        token:token,
        tokenSecret:tokenSecret,
        name:profile._json.name,
        username: profile.username,
        images: {
          profile: profile._json.profile_image_url,
          banner: profile._json.profile_banner_url
        }
      });
    }
  ));

  passport.serializeUser((user, done) => {
    // Logging.log("serialise");
    // Logging.log(user);
    done(null,user);
  })
  passport.deserializeUser((user, done) => {
    // Logging.log("deserialise");
    // Logging.log(user);
    done(null,user);
  })
};
