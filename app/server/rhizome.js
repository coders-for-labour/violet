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
 * @type {{Auth: {findOrCreateUser: *}}}
 */

module.exports = {
  init: options => {
    _options.rhizomeUrl = options.rhizomeUrl || 'http://rhizome.codersforcorbyn.com/api/v1';
    _options.appToken = options.appToken || false;
  },
  Auth: {
    findOrCreateUser: _findOrCreateUser
  }
};
