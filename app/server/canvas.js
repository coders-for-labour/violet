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
//var StreamBuffers = require('stream-buffers');
var Canvas = require('canvas');
var Image = Canvas.Image;
//
// var _test = () => {
//   var canvas = new Canvas(73, 73);
//   var ctx = canvas.getContext('2d');
//
//
// }

var _images = [];
var _cacheImages = () => {
  _images[0] = fs.readFileSync(`${__dirname}/static/images/twibbon1.png`);
  _images[1] = fs.readFileSync(`${__dirname}/static/images/twibbon2.png`);
  _images[2] = fs.readFileSync(`${__dirname}/static/images/twibbon3.png`);
  _images[3] = fs.readFileSync(`${__dirname}/static/images/twibbon4.png`);
  _images[4] = fs.readFileSync(`${__dirname}/static/images/twibbon5.png`);
  _images[5] = fs.readFileSync(`${__dirname}/static/images/twibbon6.png`);
};

var _drawImage = (ctx, imgData) => {
  return new Promise((resolve,reject) {
    var image = new Image();
    image.dataMode = Image.MODE_IMAGE;
    image.onload = () => {
      ctx.drawImage(image, 0, 0, 200, 200);
      resolve(true);
    };
  
    image.src = imgData;
  });
};

module.exports.init = app => {
  _cacheImages();
  app.get('/twibbon/:choice([1-6])', (req, res) => {
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
};
