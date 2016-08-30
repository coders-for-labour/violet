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
var LevelStore = require('level-session-store')(session);
var morgan = require('morgan');
var Logging = require('./logging');
var Config = require('./config');
var passport = require('passport');
var auth = require('./auth');
var twitter = require('./twitter');
var Canvas = require('./canvas');

/**
 * Express
 */
var app = module.exports = express();
var _env = app.get('env');
var _map = {
  development: 'dev',
  production: 'prod',
  test: 'test'
};
Config.env = _map[_env];

/**
 * Configuration
 */
var configureDevelopment = () => {
  app.use(morgan('short'));
  app.set('port', Config.listenPort.dev);
};

var configureProduction = () => {
  app.use(morgan('short'));
  app.set('port', Config.listenPort.prod);
};

var configureTest = () => {
  app.use(morgan('short'));
  app.set('port', Config.listenPort.test);
};

var configureApp = env => {
  app.enable('trust proxy', 1);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(methodOverride());

  Logging.log(Config, Logging.Constants.LogLevel.VERBOSE);

  app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'BhMG3w4ECrD3lbXkRU6D8wxC0PTy2D7HCG1sDpVpBaXDFvxUVIx1sHL3ifqCYb6',
    store: new LevelStore(Config.sessionStorePath)
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(`${__dirname}/static`));

  auth.init(app);
  twitter.init(app);
  Canvas.init(app);

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
Logging.log(`${Config.app.title} listening on port ${app.get('port')} in ${app.settings.env} mode.`,
            Logging.Constants.LogLevel.INFO);
app.server = app.listen(app.set('port'));

app.get('/:mode(dashboard|detail|blocklist|voted)/:id?', (req, res, next) => {
  res.sendFile(`${__dirname}/static/index.html`);
});
