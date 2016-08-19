'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file app.js
 * @description
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var express = require('express');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var morgan = require('morgan');
var Logging = require('./logging');
var Config = require('./config');
var passport = require('passport');
var auth = require('./auth');

/**
 * Express
 */
var app = module.exports = express();
var _env = app.get('env');
var _map = {
  'development': 'dev',
  'production': 'prod',
  'test': 'test'
};

var mongoStoreSettings = {
  url: `mongodb://${Config.mongoUrl[_map[_env]]}/${Config.app.code}-sessions`,
  db: `${Config.app.code}-sessions`,
  host: Config.mongoUrl[_map[_env]],
  collect: 'sessions'
};

/**
 * Configuration
 */
var configureDevelopment = () => {
  Config.env = 'dev';
  app.use(morgan('short'));
  app.set('port', Config.listenPort.dev);
};

var configureProduction = () => {
  Config.env = 'prod';
  app.use(morgan('short'));
  app.set('port', Config.listenPort.prod);
};

var configureTest = () => {
  Config.env = 'test';
  app.use(morgan('short'));
  app.set('port', Config.listenPort.test);
};

var configureApp = env => {
  app.enable('trust proxy', 1);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(methodOverride());

  app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'asdknjszsjh485uvep9',
    store: new MongoStore(mongoStoreSettings)
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/static'));

  auth.init(app);

  switch (env) {
    default:
    case 'development': {
      configureDevelopment();
    }
      break;
    case 'production': {
      configureProduction();
    }
      break;
    case 'test': {
      configureTest();
    }
      break;
  }
};

configureApp(_env);

/**
 *
 */
console.log(`${Config.app.title} listening on port %d in %s mode.`, app.get('port'), app.settings.env);
app.server = app.listen(app.set('port'));

