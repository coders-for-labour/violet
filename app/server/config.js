'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file config.js
 * @description
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var express = require('express');
var fs = require('fs');

/**
 * @class Config
 *
 */
class Config {
  constructor() {
    if (!process.env.VIOLET_SERVER_ID) {
      throw new Error('You need to add config ' +
        'settings for your environment to config.json');
    }

    this._env = express().get('env');
    this._settings = this._loadSettings();
  }

  get settings() {
    return this._settings;
  }

  _loadSettings() {
    var json = fs.readFileSync('./config.json');
    var settings = JSON.parse(json);

    for (var variable in settings.local.environment) {
      if (!process.env[variable]) {
        throw new Error(`You must specify the ${variable} environment variable`);
      }
      settings.local.environment[variable] = process.env[variable];
    }

    return Object.assign(settings.global, settings.local.environment, settings.local[process.env.SERVER_ID]);
  }
}

module.exports = (new Config()).settings;
