'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file tools.js
 * @description
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var Logging = require('./logging');
var Config = require('./config');
var Twitter = require('twitter');

var _getStatuses = (req, res) => {
  if ( !req.user ) {
    res.sendStatus(400);
    return;
  }

  var twitter = new Twitter({
    consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
    consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
    access_token_key: req.user.token,
    access_token_secret: req.user.tokenSecret
  });

  twitter.get('statuses/user_timeline', function(error, tweets, response){
    res.json({err:false,res:tweets.map(function(t){
      return {
        id: t.id,
        text: t.text,
        entities: t.entities,
        favourites: t.favorite_count,
        retweets: t.retweet_count
      };
    })});
  });
}

var _blockAccounts = (req, res) => {
  if ( !req.user ) {
    res.sendStatus(400);
    return;
  }

  var twitter = new Twitter({
    consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
    consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
    access_token_key: req.user.token,
    access_token_secret: req.user.tokenSecret
  });

  res.json({err:false,res:"Successfully blocked accounts"});
}

module.exports.init = (app) => {
  app.get('/api/v1/twitter/statuses', _getStatuses);
  app.get('/api/v1/twitter/block', _blockAccounts);
}
