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

const fs = require('fs');
const Logging = require('./logging');
const Config = require('./config');
const Rhizome = require('./rhizome');
const Twitter = require('twitter');
const rest = require('restler');
const _ = require('underscore');
require('sugar');

var _queueManager = null;

/**
 * @param {object} queueItem - All parameters necessary to execute an API call
 * @return {Promise} - resolves with the queue item (results populated)
 * @private
 */
var _apiTask = queueItem => {
  var twitter = new Twitter({
    consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
    consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
    access_token_key: queueItem.token,
    access_token_secret: queueItem.tokenSecret
  });

  return new Promise((resolve, reject) => {
    var methods = {
      GET: 'get',
      POST: 'post'
    };

    twitter[methods[queueItem.method]](queueItem.api, queueItem.params, function(error, data, response) {
      Logging.log(data, Logging.Constants.LogLevel.SILLY);
      if (error) {
        resolve(queueItem);
        return;
      }
      queueItem.completed = true;
      queueItem.results = data;
      resolve(queueItem);
    });
  });
};

/**
 *
 */
class TwitterQueueManager {
  constructor() {
    this._rateLimiter = {};
    this._queue = [];
    setInterval(_.bind(this.flushQueue, this), this.Constants.INTERVAL);
  }

  get Constants() {
    return {
      INTERVAL: 30000
    };
  }

  addToQueue(queueItem) {
    queueItem.method = queueItem.method ? queueItem.method : 'GET';
    this._queue.push(queueItem);
  }

  _isRateLimited(queueItem) {
    if (!this._rateLimiter[queueItem.token] || Date.create().isAfter(this._rateLimiter[queueItem.token].windowEnds)) {
      Logging.log(`FIRST CALL IN WINDOW: ${queueItem.token}`, Logging.Constants.LogLevel.SILLY);
      this._rateLimiter[queueItem.token] = {
        calls: 1,
        windowEnds: Date.create().advance('15 minutes')
      };
      return false;
    }

    if (this._rateLimiter[queueItem.token].calls >= 15) {
      Logging.log(`RATE LIMITING: ${queueItem.token}`, Logging.Constants.LogLevel.SILLY);
      return true;
    }

    Logging.log(`ADDING CALL FOR: ${queueItem.token}`, Logging.Constants.LogLevel.SILLY);
    this._rateLimiter[queueItem.token].calls++;
    return false;
  }

  flushQueue() {
    Logging.log(this._queue, Logging.Constants.LogLevel.DEBUG);
    var tasks = this._queue.filter(qi => {
      return this._isRateLimited(qi) === false;
    }).map(qi => _apiTask(qi));

    Promise.all(tasks)
      .then(Logging.Promise.logArray('Twitter Results: ', Logging.Constants.LogLevel.DEBUG))
      .catch(err => Logging.log(err));

    this._queue = this._queue.filter(qi => qi.completed !== true);
  }
}

_queueManager = new TwitterQueueManager();
var _blocklistSubscribers = [];

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
 * @param {object} user - req.user object
 * @param {array} blocklist - array of screen_names to block
 * @private
 */
var _queueBlocklist = (user, blocklist) => {
  if (blocklist.length === 0) {
    return;
  }
  Logging.log(`Scheduling block task for ${blocklist.length} accounts.`, Logging.Constants.LogLevel.INFO);

  blocklist.forEach(b => {
    _queueManager.addToQueue({
      method: 'POST',
      username: user.username,
      api: 'blocks/create.json',
      params: {screen_name: b.username, skip_statuses: true},
      token: user.token,
      tokenSecret: user.tokenSecret
    });
  });
};

/**
 * @param {ID} userRhizomeId - Rhizome ID of the user to update
 * @param {Array} masterBlocklist - list of all the screen_names to block currently
 * @return {Promise} - resolved to a list of screen names to block via the twitter API
 * @private
 */
var _updateSubscriberBlocklist = (userRhizomeId, masterBlocklist) => {
  if (_blocklistSubscribers.indexOf(userRhizomeId) === -1) {
    _blocklistSubscribers.push(userRhizomeId);
    Rhizome.App.saveMetadata('BLOCKLIST_SUBSCRIBERS', _blocklistSubscribers)
      .then(Logging.Promise.log('Saved User Blocklist'));
  }

  var blocklist = [];

  return new Promise((resolve, reject) => {
    Rhizome.User.loadMetadata(userRhizomeId, 'BLOCKED_ACCOUNTS', [])
      .then(userBlocked => {
        Logging.log(`Updating blocklist for ${userRhizomeId}.`, Logging.Constants.LogLevel.VERBOSE);

        blocklist = masterBlocklist.reduce((prev, curr) => {
          if (userBlocked.value.indexOf(curr.username) === -1) {
            prev.push(curr);
          }
          return prev;
        }, []);

        Logging.log(`Updated Blocklist for ${userRhizomeId}`, Logging.Constants.LogLevel.VERBOSE);

        if (blocklist.length === 0) {
          Logging.log(`No new accounts to block for ${userRhizomeId}`, Logging.Constants.LogLevel.VERBOSE);
          resolve(blocklist);
          return;
        }
        Rhizome.User.saveMetadata(userRhizomeId, 'BLOCKED_ACCOUNTS',
          userBlocked.value.concat(blocklist.map(b => b.username)))
          .then(Logging.Promise.log('Updated subscriber blocklist'));

        Logging.log(`Blocking ${blocklist.length} accounts for ${userRhizomeId}`, Logging.Constants.LogLevel.VERBOSE);
        resolve(blocklist);
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

  if (!req.query.subscriber) {
    _updateSubscriberBlocklist(req.user.rhizomeId, req.app.blockList)
      .then(blocklist => {
        _queueBlocklist(req.user, blocklist);
        res.json(blocklist.length);
      });
    return;
  }

  _queueBlocklist(req.user, req.app.blockList);
  res.json(req.app.blockList);
};

/**
 * @param {object} req - Express JS Request
 * @param {object} res - Express JS Response
 * @private
 */
var _getBlocklist = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }

  res.json(req.app.blockList);
};

/**
 * @param {object} req - Express JS Request
 * @param {object} res - Express JS Response
 * @private
 */
var _getBlocklistCount = (req, res) => {
  res.json(req.app.blockListCount);
};

/**
 * @param {object} req - Express JS Request
 * @param {object} res - Express JS Response
 * @private
 */
var _getBlocklistSubscribed = (req, res) => {
  var subscribed = false;
  if (_blocklistSubscribers.indexOf(req.user.rhizomeId) !== -1) {
    subscribed = true;
    return;
  }

  res.json(subscribed);
};

/**
 * @param {object} app - Express app object
 * @return {Promise} - resolves to blocklist
 * @private
 */
var _loadBlocklist = app => {
  return new Promise((resolve, reject) => {
    rest.get(Config.VIOLET_BLOCKLIST_URL, {timeout: 5000})
      .on('success', data => {
        Logging.log(data, Logging.Constants.LogLevel.SILLY);

        var twitter = new Twitter({
          consumer_key: Config.VIOLET_TW_CONSUMER_KEY,
          consumer_secret: Config.VIOLET_TW_CONSUMER_SECRET,
          access_token_key: Config.VIOLET_TW_ACCESS_TOKEN,
          access_token_secret: Config.VIOLET_TW_ACCESS_TOKEN_SECRET
        });

        twitter.get('users/lookup.json', {screen_name: data.join(',')}, function(error, data, response) {
          if (error) {
            Logging.log('Error getting blocklist details', Logging.Constants.LogLevel.ERR);
            reject(error);
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
          Logging.log(data[0], Logging.Constants.LogLevel.SILLY);
          Logging.log(`Loaded Blocklist Length: ${data.length}`, Logging.Constants.LogLevel.INFO);
          app.blockList = list;
          app.blockListCount = data.length;
          resolve(app.blockList);
        });
      });
  });
};

var _updateBlocklistSubscribers = app => {
  _blocklistSubscribers.forEach(s => {
    Rhizome.User.load(s)
      .then(u => {
        var twauth = u.auth.find(a => a.app === 'twitter');
        Logging.log(twauth, Logging.Constants.LogLevel.DEBUG);
        if (!twauth) {
          return;
        }

        _updateSubscriberBlocklist(s, app.blockList)
          .then(blocklist => {
            _queueBlocklist({
              username: twauth.username,
              token: twauth.token,
              tokenSecret: twauth.tokenSecret
            }, blocklist);
          });
      });
  });
};

/**
 * @param {Object} app - ExpressJS app object
 */
module.exports.init = app => {
  Rhizome.App.loadMetadata('BLOCKLIST_SUBSCRIBERS', [])
    .then(subscribers => {
      _blocklistSubscribers = subscribers;
      Logging.log(`Loaded ${_blocklistSubscribers.length} Blocklist Subscribers`, Logging.Constants.LogLevel.VERBOSE);
    });

  setInterval(_loadBlocklist, 60000 * 5, app);
  setInterval(_updateBlocklistSubscribers, 60000 * 60, app);
  _loadBlocklist(app).then(() => {
    _updateBlocklistSubscribers(app);
  });

  app.get('/api/twitter/statuses', _getStatuses);
  app.get('/api/blocklist', _getBlocklist);
  app.get('/api/blocklist/count', _getBlocklistCount);
  app.get('/api/blocklistblock', _blockAccounts);
  app.get('/api/blocklist/block', _blockAccounts);
  // app.get('/api/blocklist/subscribe', _getBlocklistSubscribed);
  app.get('/api/blocklist/subscribed', _getBlocklistSubscribed);
};

module.exports.updateProfile = (user, imgBuffer) => {
  if (!user) {
    return false;
  }

  Logging.log(`Scheduling Profile Update task for user : ${user.id}.`, Logging.Constants.LogLevel.INFO);

  _queueManager.addToQueue({
    username: user.username,
    method: 'POST',
    api: 'account/update_profile_image.json',
    params: {
      image: imgBuffer.toString('base64'),
      include_entities: false,
      skip_statuses: true
    },
    token: user.token,
    tokenSecret: user.tokenSecret
  });

  Logging.log(imgBuffer, Logging.Constants.LogLevel.DEBUG);

  return true;
};
