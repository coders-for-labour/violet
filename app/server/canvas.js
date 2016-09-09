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

var rest = require('restler');
var fs = require('fs');
var Logging = require('./logging');
// var StreamBuffers = require('stream-buffers');
var Canvas = require('canvas');
var Image = Canvas.Image;
//
// var _test = () => {
//   var canvas = new Canvas(73, 73);
//   var ctx = canvas.getContext('2d');
//
//
// }

var _imageNames = [
  "twibbon1.png",
  "twibbon2.png",
  "twibbon3.png",
  "twibbon4.png",
  "twibbon5.png",
  "twibbon6.png"
];

var choiceRange = `[1-${_imageNames.length}]`;
console.log(choiceRange);
var _images = [];
var _cacheImages = () => {
  _images = _imageNames.map((name) => {
    return fs.readFileSync(`${__dirname}/static/images/${name}`);
  });
};

var _drawImage = (ctx, imgData) => {
  return new Promise((resolve, reject) => {
    var image = new Image();
    image.dataMode = Image.MODE_IMAGE;
    image.onload = () => {
      ctx.drawImage(image, 0, 0, 200, 200);
      resolve(true);
    };
    image.src = imgData;
  });
};

var _getOverlays = (req, res) => {
  return res.json(_imageNames);
};

var _save = (req, res) => {
  // DO SAVING STUFF
  res.send('null');
  res.status(200).end();
};

module.exports.init = app => {
  _cacheImages();
  app.get(`/twibbon/:choice(${choiceRange})`, (req, res) => {
    var img = req.user.images.profile.replace('_normal', '');
    Logging.log(img);
    rest.get(img)
      .on('success', (data, response) => {
        fs.writeFileSync('/home/chris/tmp/test.jpg', response.raw);

        var canvas = new Canvas(200, 200);
        var ctx = canvas.getContext('2d');
        ctx.antialias = 'subpixel';
        ctx.patternQuality = 'best';

        _drawImage(ctx, response.raw)
          .then(() => {
            ctx.globalAlpha = 1;
          })
          .then(_drawImage(ctx, _images[req.params.choice - 1]))
          .then(() => {
            fs.writeFileSync('/home/chris/tmp/output.png', canvas.toBuffer());
            var fileRead = fs.createReadStream('/home/chris/tmp/output.png');
            res.type('png');
            fileRead.pipe(res);
          });

        // ctx.toBuffer();
        // var buffer = new StreamBuffers.ReadableStreamBuffer();
        // buffer.put(canvas.toBuffer());
        // fs.writeFileSync('/home/chris/tmp/output.png', canvas.toBuffer());
        // var fileRead = fs.createReadStream('/home/chris/tmp/output.png');
        // res.type('png');
        // fileRead.pipe(res);
        // res.sendStatus(200);
      });
  });

  app.get('/twibbon/overlay', _getOverlays);
  app.post(`/twibbon/save/:choice(${choiceRange})`, _save);
};
