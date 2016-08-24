'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file twitter.js
 * @description
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var Logging = require('./logging');
var Config = require('./config');
var Twitter = require('twitter');

var _getStatuses = (req, res) => {
  if (!req.user) {
    res.sendStatus(400);
    return;
  }

  var twitter = new Twitter({
    consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
    consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
    access_token_key: req.user.token,
    access_token_secret: req.user.tokenSecret
  });

  twitter.get('statuses/user_timeline', function(error, tweets, response) {
    res.json({err: false, res: tweets.map(function(t) {
      return {
        id: t.id,
        text: t.text,
        entities: t.entities,
        favourites: t.favorite_count,
        retweets: t.retweet_count
      };
    })});
  });
};

var _blockTask = (twitter, screenName) => {
  var params = {
    screen_name: screenName,
    skip_statuses: true
  };

  return new Promise((resolve, reject) => {
    twitter.post('blocks/create.json', params, function(error, data, response) {
      Logging.log(`Blocking: ${params.screen_name}`);
      if (error) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
};

var _blockAccounts = (req, res) => {
  if (!req.user) {
    res.sendStatus(400);
    return;
  }

  Logging.log(`Attempting to block ${req.app.blockList.length} accounts.`, Logging.Constants.LogLevel.INFO);

  var twitter = new Twitter({
    consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
    consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
    access_token_key: req.user.token,
    access_token_secret: req.user.tokenSecret
  });

  var promises = [];
  req.app.blockList.forEach(b => {
    promises.push(_blockTask(twitter, b));
  });
  Promise.all(promises)
    .then(Logging.Promise.logProp('Blocked: ', 'length'))
    .then(results => {
      results = results.filter(r => r);
      res.json({err: false, res: `Successfully blocked ${results.length} accounts`});
    }, err => {
      Logging.log(err);
      res.json({err: true, res: err.message});
    });
};

module.exports.init = app => {
  app.get('/api/v1/twitter/statuses', _getStatuses);
  app.get('/api/v1/twitter/block', _blockAccounts);
};
