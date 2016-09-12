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

/**
 * AUTH
 */

var _findOrCreateUser = user => {
  return new Promise((resolve, reject) => {
    var url = `${Config.rhizomeUrl}/user/${user.app}/${user.id}`;
    Logging.log(url, Logging.Constants.LogLevel.DEBUG);
    restler.get(url, {query: {token: Config.VIOLET_RHIZOME_APP_TOKEN}})
      .on('success', data => {
        Logging.log(data, Logging.Constants.LogLevel.DEBUG);

        if (data === false) {
          url = `${Config.rhizomeUrl}/user`;
          restler.post(url, {query: {token: Config.VIOLET_RHIZOME_APP_TOKEN}, data: user})
            .on('success', data => {
              Logging.log(data, Logging.Constants.LogLevel.DEBUG);
              resolve(Object.assign(user, {rhizomeId: data.id}));
            })
            .on('error', err => {
              Logging.log(data, Logging.Constants.LogLevel.ERR);
              reject(err);
            });
        } else {
          var userId = data.id;
          url = `${Config.rhizomeUrl}/user/${userId}/${user.app}/token`;
          restler.put(url, {query: {token: Config.VIOLET_RHIZOME_APP_TOKEN},
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
      .on('error', err => {
        Logging.log(err, Logging.Constants.LogLevel.ERR);
      });
  });
}

/**
 * @type {{Auth: {findOrCreateUser: *}}}
 */

module.exports = {
  Auth: {
    findOrCreateUser: _findOrCreateUser
  }
}
