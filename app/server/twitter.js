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
var rest = require('restler');

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

var _blockTask = (twitter, profile) => {
  var params = {
    screen_name: profile.username,
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

/**
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @private
 */
var _blockAccounts = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
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
      res.json({err: false, res: results.length});
    }, err => {
      Logging.log(err);
      res.json({err: true, res: err.message});
    });
};

var _getBlocklist = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }

  res.json(req.app.blockList);
};

/**
 * @param {object} app - Express app object
 * @private
 */
var _loadBlocklist = app => {
  rest.get(Config.VIOLET_BLOCKLIST_URL, {timeout: 5000})
    .on('success', data => {
      Logging.log(data, Logging.Constants.LogLevel.VERBOSE);

      var twitter = new Twitter({
        consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
        consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
        access_token_key: Config.VIOLET_TW_ACCESS_TOKEN,
        access_token_secret: Config.VIOLET_TW_ACCESS_TOKEN_SECRET
      });

      twitter.get('users/lookup.json', {screen_name: data.join(',')}, function(error, data, response) {
        var list = data.map(p => {
          return {
            id: p.id,
            name: p.name,
            username: p.screen_name,
            description: p.description,
            followers_count: p.followers_count,
            friends_count: p.friends_count,
            images: {
              profile: p.profile_image_url,
              banner: p.profile_banner_url
            },
            status: {
              id: p.status ? p.status.id : -1,
              created_at: p.status ? p.status.created_at : '',
              text: p.status ? p.status.text : '',
              retweet_count: p.status ? p.status.retweet_count : 0,
              favorite_count: p.status ? p.status.favorite_count : 0
            }
          };
        });
        // Logging.log(list);
        Logging.log(data[0], Logging.Constants.LogLevel.VERBOSE);
        Logging.log(`Blockist Length: ${data.length}`, Logging.Constants.LogLevel.INFO);
        app.blockList = list;
      });
    });
};

module.exports.init = app => {
  _loadBlocklist(app);

  app.get('/api/twitter/statuses', _getStatuses);
  app.get('/api/blocklistblock', _blockAccounts);
  app.get('/api/blocklist', _getBlocklist);
};
