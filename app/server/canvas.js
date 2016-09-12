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

// var Logging = require('./logging');
var Composer = require('./composer');

var _twibbons = [
  `${__dirname}/images/twibbon/twibbon1.png`,
  `${__dirname}/images/twibbon/twibbon2.png`,
  `${__dirname}/images/twibbon/twibbon3.png`,
  `${__dirname}/images/twibbon/twibbon4.png`,
  `${__dirname}/images/twibbon/twibbon5.png`,
  `${__dirname}/images/twibbon/twibbon6.png`
];

var choiceRange = `[1-${_twibbons.length}]`;
console.log(choiceRange);
var _images = [];
var _cacheImages = () => {
  _images = _twibbons.map((name) => {
    return fs.readFileSync(name);
  });
};

var _banners = [
  {file: `${__dirname}/images/banners/banner1.png`, aspect: 0.555}
];

var choiceRange = `[1-${_imageNames.length}]`;
console.log(choiceRange);
var _images = [];
var _cacheImages = () => {
  _images = _imageNames.map((name) => {
    return fs.readFileSync(`${__dirname}/static/images/${name}`);
  });
};

var _getOverlays = (req, res) => {
  return res.json(_twibbons);
};

var _save = (req, res) => {
  // DO SAVING STUFF
  res.send('null');
  res.status(200).end();
};

module.exports.init = app => {
  _cacheImages();
  app.get(`/twibbon/:choice([$twibbonsRange])`, (req, res) => {
    var imgUrl = req.user.images.profile.replace('_normal', '');
    var composer = new Composer(500, 500);
    composer.disableCache();
    composer.params('antialias', 'subpixel');
    composer.params('patternQuality', 'best');
    composer.imageFromUrl(imgUrl, {gravity: 'mid'});
    composer.params('globalAlpha', 1);
    composer.imageFromFile(_twibbons[req.params.choice - 1], {
      width: 1.0, height: 1.0, gravity: 'bottom', cacheFile: true});
    composer.text('Vote Corbyn: For hope, not fear', {
      gravity: 'top', top: 20, width: 0.35, height: 20, fontSize: 20});
    composer.render().then(readStream => {
      res.type('png');
      readStream.pipe(res);
    });
  });

  app.get('/banner/:choice([1-6])', (req, res) => {
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
  });

  app.get('/twibbon/overlay', _getOverlays);
  app.post(`/twibbon/save/:choice(${choiceRange})`, _save);
};
