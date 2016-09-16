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

const restler = require('restler');
const Config = require('./config');
const Logging = require('./logging');

var _options = {};

/**
 * AUTH
 */

var _findOrCreateUser = user => {
  if (!_options.appToken) {
    return Promise.reject(new Error('You must specify a valid Rhizome App Token'));
  }

  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${user.app}/${user.id}`;
    Logging.log(url, Logging.Constants.LogLevel.DEBUG);
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', data => {
        Logging.log(data, Logging.Constants.LogLevel.SILLY);

        if (data === false) {
          url = `${Config.rhizomeUrl}/user`;
          restler.post(url, {query: {token: _options.appToken}, data: user})
            .on('success', data => {
              Logging.log(data, Logging.Constants.LogLevel.SILLY);
              resolve(Object.assign(user, {rhizomeId: data.id}));
            })
            .on('error', err => {
              Logging.log(data, Logging.Constants.LogLevel.ERR);
              reject(err);
            });
        } else {
          var userId = data.id;
          url = `${_options.rhizomeUrl}/user/${userId}/${user.app}/token`;
          restler.put(url, {query: {token: _options.appToken},
            data: {token: user.token, tokenSecret: user.tokenSecret}})
            .on('success', data => {
              Logging.log(data, Logging.Constants.LogLevel.DEBUG);
              resolve(Object.assign(user, {rhizomeId: userId}));
            })
            .on('error', err => {
              Logging.log(data, Logging.Constants.LogLevel.ERR);
              reject(err);
            });
        }
      })
      .on('error', Logging.Promise.logError());
  });
};

/**
 * Metadata
 */

/**
 * @param {String} key - identifier for the metadata
 * @param {*} defaultValue - default to return if metadata not in datastore
 * @return {Promise<T>|Promise} - promise fulfilled with the value of the metadata
 * @private
 */
var _loadAppMetadata = (key, defaultValue) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/app/metadata/${key}`;
    Logging.log(url, Logging.Constants.LogLevel.DEBUG);
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', (data, response) => {
        Logging.log(data, Logging.Constants.LogLevel.DEBUG);
        resolve(data);
      })
      .on('error', err => reject(err))
      .on('404', err => {
        Logging.log(err, Logging.Constants.LogLevel.DEBUG);
        resolve(defaultValue);
      })
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

var _saveAppMetadata = (key, value) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/app/metadata/${key}`;
    Logging.log(url, Logging.Constants.LogLevel.DEBUG);
    restler.post(url, {
      query: {
        token: _options.appToken
      },
      data: {
        value: JSON.stringify(value)
      }
    }).on('success', (data, response) => {
      Logging.log(data, Logging.Constants.LogLevel.DEBUG);
      resolve(data);
    })
    .on('error', err => reject(err))
    .on('40x', err => reject(err))
    .on('50x', err => reject(err));
  });
};

var _loadUser = rhizomeUserId => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}`;
    Logging.log(url, Logging.Constants.LogLevel.DEBUG);
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', (data, response) => {
        Logging.log(data, Logging.Constants.LogLevel.DEBUG);
        resolve(data);
      })
      .on('error', err => reject(err))
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

var _loadUserMetadata = (rhizomeUserId, key, defaultValue) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}/metadata/${key}`;
    Logging.log(url, Logging.Constants.LogLevel.DEBUG);
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', (data, response) => {
        Logging.log(data, Logging.Constants.LogLevel.DEBUG);
        resolve(data);
      })
      .on('error', err => reject(err))
      .on('404', err => {
        Logging.log(err, Logging.Constants.LogLevel.DEBUG);
        resolve(defaultValue);
      })
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

var _saveUserMetadata = (rhizomeUserId, key, value) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}/metadata/${key}`;
    Logging.log(`Saving: ${value}`, Logging.Constants.LogLevel.DEBUG);
    restler.post(url, {
      query: {
        token: _options.appToken
      },
      data: {
        value: JSON.stringify(value)
      }
    })
    .on('error', err => reject(err))
    .on('success', (data, response) => {
      Logging.log(data, Logging.Constants.LogLevel.DEBUG);
      resolve(data);
    })
    .on('40x', err => reject(err))
    .on('50x', err => reject(err));
  });
};

/**
 * @type {{
 *  init: ((p1:*)),
 *  Auth: {
 *    findOrCreateUser: ((p1?:*))
*   },
*   App: {
*     getMetadata: ((p1:*)),
*     saveMetadata: ((p1:*, p2:*))
*   },
*   User: {
*     getMetadata: ((p1:*, p2:*)),
*     saveMetadata: ((p1:*, p2:*, p3:*))
*   }
*   }}
 */
module.exports = {
  init: options => {
    Logging.log(options.rhizomeUrl, Logging.Constants.LogLevel.DEBUG);
    _options.rhizomeUrl = options.rhizomeUrl || 'http://rhizome.codersforcorbyn.com/api/v1';
    _options.appToken = options.appToken || false;
  },
  Auth: {
    findOrCreateUser: _findOrCreateUser
  },
  App: {
    loadMetadata: _loadAppMetadata,
    saveMetadata: _saveAppMetadata
  },
  User: {
    load: _loadUser,
    loadMetadata: _loadUserMetadata,
    saveMetadata: _saveUserMetadata
  }
};
