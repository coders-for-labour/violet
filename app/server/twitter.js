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

const Logging = require('./logging');
const Config = require('./config');
const Rhizome = require('rhizome-api-js');
const rest = require('restler');
const Queue = require('./api-queue');
require('sugar');

var _blocklistSubscribers = [];

/**
 * @description Load the authenticated user's tweets
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @private
 */
var _getStatuses = (req, res) => {
  if (!req.user) {
    res.sendStatus(400);
    return;
  }

  Queue.manager.exec({
    app: Queue.Constants.App.TWITTER,
    api: 'statuses/user_timeline',
    token: req.user.token,
    tokenSecret: req.user.tokenSecret
  }).then(qi => {
    res.json({
      err: false,
      res: qi.results.map(function(t) {
        return {
          id: t.id,
          text: t.text,
          entities: t.entities,
          favourites: t.favorite_count,
          retweets: t.retweet_count
        };
      })
    });
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
    Queue.manager.add({
      app: Queue.Constants.App.TWITTER,
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
 * @description Update the specified user blocklist data
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
          if (userBlocked.indexOf(curr.username) === -1) {
            prev.push(curr);
          }
          return prev;
        }, []);

        if (blocklist.length === 0) {
          Logging.log(`No new accounts to block for ${userRhizomeId}`, Logging.Constants.LogLevel.VERBOSE);
          resolve(blocklist);
          return;
        }
        Rhizome.User.saveMetadata(userRhizomeId, 'BLOCKED_ACCOUNTS',
          userBlocked.concat(blocklist.map(b => b.username)))
          .then(Logging.Promise.logProp('Updated subscriber blocklist', 'value'));

        Logging.log(`Blocking ${blocklist.length} new accounts for ${userRhizomeId}`,
          Logging.Constants.LogLevel.VERBOSE);
        resolve(blocklist);
      });
  });
};

/**
 * @description Load and verify the list of accounts to be blocked
 * @param {object} app - Express app object
 * @return {Promise} - resolves to blocklist
 * @private
 */
var _loadBlocklist = app => {
  return new Promise((resolve, reject) => {
    rest.get(Config.VIOLET_BLOCKLIST_URL, {timeout: 5000})
      .on('success', data => {
        Logging.log(data, Logging.Constants.LogLevel.SILLY);

        Queue.manager.exec({
          app: Queue.Constants.App.TWITTER,
          api: 'users/lookup.json',
          params: {screen_name: data.join(',')},
          token: Config.VIOLET_TW_ACCESS_TOKEN,
          tokenSecret: Config.VIOLET_TW_ACCESS_TOKEN_SECRET
        }).then(qi => {
          var list = qi.results.map(p => {
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
          Logging.log(list[0], Logging.Constants.LogLevel.SILLY);
          Logging.log(`Loaded Blocklist Length: ${list.length}`, Logging.Constants.LogLevel.INFO);
          app.blockList = list;
          app.blockListCount = list.length;
          resolve(app.blockList);
        }).catch(err => reject(err));
      });
  });
};

/**
 * @description Update the blocklists for all subscribers
 * @param {object} app -
 * @private
 */
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
 *
 * @param {object} user - Authenticated user for whom the profile image will be updated
 * @param {Buffer} imgBuffer - Buffer containing image data for the profile
 * @return {boolean} - true if successfully queued the api call
 */
module.exports.updateProfile = (user, imgBuffer) => {
  if (!user) {
    return false;
  }

  Logging.log(`Scheduling Profile Update task for user : ${user.id}.`, Logging.Constants.LogLevel.INFO);

  Queue.manager.add({
    app: Queue.Constants.App.TWITTER,
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

/**
 * @description /api/blocklist/block
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
 * @description [GET] /api/blocklist
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
 * @description [GET] /api/blocklist/count
 * @param {object} req - Express JS Request
 * @param {object} res - Express JS Response
 * @private
 */
var _getBlocklistCount = (req, res) => {
  res.json(req.app.blockListCount);
};

/**
 * @description [GET] /api/blocklist/subscribed
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
 * @param {Object} app - ExpressJS app object
 */
module.exports.init = app => {
  setInterval(_loadBlocklist, 60000 * 5, app);
  setInterval(_updateBlocklistSubscribers, 60000 * 60, app);

  _loadBlocklist(app).then(() => {
    Rhizome.App.loadMetadata('BLOCKLIST_SUBSCRIBERS', [])
      .then(subscribers => {
        _blocklistSubscribers = subscribers;
        _updateBlocklistSubscribers(app);
        Logging.log(`Loaded ${_blocklistSubscribers.length} Blocklist Subscribers`, Logging.Constants.LogLevel.INFO);
      });
  });

  app.get('/api/twitter/statuses', _getStatuses);
  app.get('/api/blocklist', _getBlocklist);
  app.get('/api/blocklist/count', _getBlocklistCount);
  app.get('/api/blocklistblock', _blockAccounts);
  app.get('/api/blocklist/block', _blockAccounts);
  // app.get('/api/blocklist/subscribe', _getBlocklistSubscribed);
  app.get('/api/blocklist/subscribed', _getBlocklistSubscribed);
};
