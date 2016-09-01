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
var _ = require('underscore');

/**
 * @param {object} queueItem - All parameters necessary to execute an API call
 * @return {Promise} - resolves with the queue item (results populated)
 * @private
 */
var _blockTask = queueItem => {
  var twitter = new Twitter({
    consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
    consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
    access_token_key: queueItem.token,
    access_token_secret: queueItem.tokenSecret
  });

  return new Promise((resolve, reject) => {
    twitter.post(queueItem.api, queueItem.params, function(error, data, response) {
      Logging.log(`Twitter: ${queueItem.api}`, Logging.Constants.LogLevel.INFO);
      Logging.log(data, Logging.Constants.LogLevel.VERBOSE);
      if (error) {
        resolve(false);
        return;
      }
      queueItem.results = data;
      resolve(queueItem);
    });
  });
};

class TwitterQueueManager {
  constructor() {
    this._queue = [];
    setTimeout(_.bind(this.flushQueue, this), this.Constants.INTERVAL);
  }

  get Constants() {
    return {
      INTERVAL: 30000
    };
  }

  addToQueue(queueItem) {
    this._queue.push(queueItem);
  }

  flushQueue() {
    Promise.all(this._queue.map(qi => _blockTask(qi)))
      .then(Logging.Promise.logArray('Twitter Results: ', Logging.Constants.LogLevel.VERBOSE))
      // .then(queue => {
      //   this._queue = queue.filter(qi => qi.repeating);
      // })
      .catch(err => Logging.log(err));
    this._queue = [];
  }
}

var _queueManager = new TwitterQueueManager();

/**
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @private
 */
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

  Logging.log(`Scheduling block task for ${req.app.blockList.length} accounts.`, Logging.Constants.LogLevel.INFO);

  req.app.blockList.forEach(b => {
    _queueManager.addToQueue({
      username: req.user.username,
      api: 'blocks/create.json',
      params: {screen_name: b.username, skip_statuses: true},
      token: req.user.token,
      tokenSecret: req.user.tokenSecret
    });
  });

  res.json(req.app.blockList.length);
};

var _getBlocklist = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }

  res.json(req.app.blockList);
};

var _getBlocklistCount = (req, res) => {
  res.json(req.app.blockListCount);
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
        if (error) {
          Logging.log('Error getting blocklist details', Logging.Constants.LogLevel.ERR);
          return;
        }

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
        Logging.log(`Blocklist Length: ${data.length}`, Logging.Constants.LogLevel.INFO);
        app.blockList = list;
        app.blockListCount = data.length;
      });
    });
};

module.exports.init = app => {
  setTimeout(_loadBlocklist, 60000 * 5, app);
  _loadBlocklist(app);

  app.get('/api/twitter/statuses', _getStatuses);
  app.get('/api/blocklistblock', _blockAccounts);
  app.get('/api/blocklist', _getBlocklist);
  app.get('/api/blocklist/count', _getBlocklistCount);
};
