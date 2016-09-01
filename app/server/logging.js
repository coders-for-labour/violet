'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file logging.js
 * @description Logging helpers
 * @module System
 * @author Chris Bates-Keegan
 *
 * @todo Centralise this logging across the app
 * @todo Add other log targets ie to datastore
 *
 */

var winston = require('winston');
var Config = require('./config');
require('sugar');

const logFormat = Date.ISO8601_DATETIME;
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  colorize: 'all',
  timestamp: () => Date.create().format(logFormat)
});
winston.addColors({
  info: 'white',
  error: 'red',
  warn: 'yellow',
  verbose: 'white',
  debug: 'white'
});

var LogLevel = {
  ERR: 'error',
  WARN: 'warn',
  INFO: 'info',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
  DEFAULT: 'info'
};

module.exports.Constants = {
  LogLevel: LogLevel
};
// var _logLevel = Config.env === 'dev' || Config.env === 'test' ? LogLevel.INFO : LogLevel.WARN;
winston.level = Config.env === 'dev' || Config.env === 'test' ? LogLevel.DEBUG : LogLevel.INFO;

/**
 *
 * @param {string} log - log entry
 * @param {integer} level - level to log at
 * @private
 */
function _log(log, level) {
  if (typeof log === 'string') {
    winston.log(level, log);
  } else {
    winston.log(level, '', log);
  }
  // if (_logLevel >= level) {
  //   if (typeof log === 'string') {
  //     winston.log()
  //     // console.log(`${logPrefix()} - ${log}`);
  //     // _stream.write(`${logPrefix()} - ${log}\n`);
  //   } else {
  //     // _stream.write(`${logPrefix()}\n`);
  //     // _stream.write(JSON.stringify(log) + '\n');
  //     // console.log(`${logPrefix()}`);
  //     // console.log(log);
  //   }
  // }
}

/**
 * STANDARD LOGGING
 */

module.exports.setLogLevel = level => {
  winston.level = level;
  // _logLevel = level;
};

/**
 * @param {string} log - Text to log
 * @param {integer} level - level to log at
 */
module.exports.log = (log, level) => {
  level = level || LogLevel.DEFAULT;
  _log(log, level);
};

/**
 * PROMISE LOGGING
 */

module.exports.Promise = {};

/**
 * @param {string} log - Text to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.log = (log, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    _log(`${log}: ${res}`, level);
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logIf = (log, val, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    if (val === res) {
      _log(`${log}: ${res}`, level);
    }
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logIfNot = (log, val, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    if (val !== res) {
      _log(`${log}: ${res}`, level);
    }
    return res;
  };
};

/**
 * PROPERTY LOGGING
 */

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res` property to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logProp = (log, prop, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    _log(`${log}: ${res[prop]}`, level);
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res` property to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logPropIf = (log, prop, val, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    if (val === res[prop]) {
      _log(`${log}: ${res[prop]}`, level);
    }
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res` property to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logPropIfNot = (log, prop, val, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    if (val !== res[prop]) {
      _log(`${log}: ${res[prop]}`, level);
    }
    return res;
  };
};

/**
 * ARRAY LOGGING
 */

/**
 * @param {string} log - Text to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logArray = (log, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    _log(`${log}: ${res.length}`, level);
    res.forEach(r => {
      _log(r);
    });
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res[]` property to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logArrayProp = (log, prop, level) => {
  level = level || LogLevel.DEFAULT;
  return res => {
    _log(`${log}: ${res.length}`, level);
    res.forEach(r => {
      _log(r[prop]);
    });
    return res;
  };
};
