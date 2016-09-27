'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file canvas.js
 * @description Image tools
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var rest = require('restler');
var Logging = require('./logging');
var Composer = require('./composer');
var Config = require('./config');
var Twitter = require('./twitter');

/**
 * @type {string[]}
 * @private
 */
var _twibbons = [
  `${__dirname}/static/images/twibbyn/twibbyn1.png`,
  `${__dirname}/static/images/twibbyn/twibbyn2.png`,
  `${__dirname}/static/images/twibbyn/twibbyn3.png`,
  `${__dirname}/static/images/twibbyn/twibbyn4.png`,
  `${__dirname}/static/images/twibbyn/twibbyn5.png`,
  `${__dirname}/static/images/twibbyn/twibbyn6.png`
];

// var _banners = [
//   {file: `${__dirname}/images/banners/banner1.png`, aspect: 0.555}
// ];

/**
 * @param {String} id - some uniqueness
 * @return {String} - hash of the input
 * @private
 */
var _genPathname = id => {
  var hash = crypto.createHash('sha1');
  return hash.update(id, 'ascii').digest('hex');
};

/**
 * @param {Object} req - ExpressJS request object
 * @param {Object} res - ExpressJS response object
 * @private
 */
var _getOverlays = (req, res) => {
  res.json(_twibbons.map(t => path.basename(t)));
};

/**
 * @param {Object} user - as loaded via authentication
 * @param {number} choice - index of the twibbyn to use
 * @param {boolean} toBuffer - true if you want a raw buffer rather than a stream
 * @return {Promise} - fulfilled with an image buffer
 * @private
 */
var _composeTwibbyn = (user, choice, toBuffer) => {
  Logging.log(`User Profile: ${user.profileImgUrl}`, Logging.Constants.LogLevel.DEBUG);
  var imgUrl = user.profileImgUrl.replace('_normal', '');

  var composer = new Composer(500, 500, toBuffer);
  // composer.disableCache();
  composer.params('antialias', 'subpixel');
  composer.params('patternQuality', 'best');
  composer.imageFromUrl(imgUrl, {gravity: 'mid'});
  composer.params('globalAlpha', 1);
  composer.imageFromFile(_twibbons[choice - 1], {
    width: 1.0, height: 1.0, gravity: 'bottom', cacheFile: true
  });

  return composer.render();
};

/**
 * @param {Object} req - ExpressJS request object
 * @param {Object} res - ExpressJS response object
 * @private
 */
var _getTwibbonImg = (req, res) => {
  _composeTwibbyn(req.user, req.params.choice).then(readStream => {
    res.type('png');
    readStream.pipe(res);
  });
};

/*
var _getBannerImg = (req, res) => {
  var banner = _banners[req.params.choice - 1];
  // var imgUrl = req.user.images.profile.replace('_normal', '');
  var text = req.query.t;

  var composer = new Composer(600, 600 * banner.aspect);
  composer.disableCache();
  composer.params('antialias', 'subpixel');
  composer.params('patternQuality', 'best');
  composer.imageFromFile(banner.file, {
    width: 1.0, height: 1.0, gravity: 'bottom', cacheFile: true});
  composer.params('globalAlpha', 1);
  // composer.imageFromUrl(imgUrl, {width: 0.1, height: 0.1, gravity: 'bottom left'});
  composer.text('I voted for Jeremy because:', {
    gravity: 'top left', top: 20, left: 30, width: 0.6, height: 400, fontSize: 20, color: '#fff'});
  composer.text(text, {
    gravity: 'top left', top: 100, left: 30, width: 0.5, height: 400, fontSize: 30, color: '#fff'});
  composer.text(`@${req.user.username}`, {
    gravity: 'top left', top: 310, left: 30, width: 0.5, height: 400, fontSize: 12, color: '#fff'});
  composer.render().then(readStream => {
    res.type('png');
    readStream.pipe(res);
  });
};*/

/**
 * @param {Object} req - ExpressJS request object
 * @param {Object} res - ExpressJS response object
 * @private
 */
var _save = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }
  var imgUrl = req.user.profileImgUrl.replace('_normal', '');
  rest.get(imgUrl)
    .on('success', (data, response) => {
      var pathname = `${Config.userDataPath}/twibbyn/${req.user.rhizomeId}_avatar_backup`;
      fs.writeFileSync(`${Config.userDataPath}/twibbyn/${_genPathname(pathname)}`, response.raw);
    })
    .on('error', err => {
      Logging.log(err, Logging.Constants.LogLevel.ERR);
    });

  Logging.log('Saving Twibbyn', Logging.Constants.LogLevel.DEBUG);

  _composeTwibbyn(req.user, req.params.choice, true)
    .then(imageBuffer => {
      Logging.log('Got Twibbyn', Logging.Constants.LogLevel.DEBUG);
      res.send(Twitter.updateProfile(req.user, imageBuffer));
      res.sendStatus(200);
    });
};

module.exports.init = app => {
  app.get(`/twibbyn/:choice([1-${_twibbons.length}])`, _getTwibbonImg);
  // app.get('/banner/:choice([1])', _getBannerImg);
  app.get('/twibbyn/overlay', _getOverlays);
  app.post(`/twibbyn/save/:choice([1-${_twibbons.length}])`, _save);
};
