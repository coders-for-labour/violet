'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file composer.js
 * @description Image tools
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var fs = require('fs');
var crypto = require('crypto');
var rest = require('restler');
var Config = require('./config');
var Logging = require('./logging');
var Canvas = require('canvas');
var Image = Canvas.Image;

var _cache = null;
var _memCache = null;

/**
 * @class Composer
 */
class Composer {
  constructor(width, height) {
    this._width = width;
    this._height = height;
    this._id = '';
    this._renderQueue = [];
    this._cache = _cache;
    this._noCache = true;
  }

  disableCache() {
    this._noCache = true;
  }

  params(param, value) {
    this._id += `${param},${value}`;
    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Setting Context: ${param} -> ${value}`, Logging.Constants.LogLevel.VERBOSE);
        Logging.log(context.ctx, Logging.Constants.LogLevel.VERBOSE);
        context.ctx[param] = value;
        resolve(context);
      });
    });
  }

  imageFromUrl(imgUrl, options) {
    var o = this._options(options);
    this._id += imgUrl;

    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        rest.get(imgUrl)
          .on('success', (data, response) => {
            Logging.log(`Rendering Image`, Logging.Constants.LogLevel.VERBOSE);
            Logging.log(o, Logging.Constants.LogLevel.VERBOSE);
            var image = new Image();
            image.dataMode = Image.MODE_IMAGE;
            image.onload = () => {
              Logging.log('Loaded Image', Logging.Constants.LogLevel.VERBOSE);
              context.ctx.drawImage(image, o.left, o.top, o.width, o.height);
              resolve(context);
            };
            image.src = response.raw;
          });
      });
    });
  }

  imageFromFile(imgFile, options) {
    var file = options.cacheFile ? _memCache.load(imgFile) : fs.readFileSync(imgFile);
    this._id += imgFile;

    return this.imageFromBuffer(file, options);
  }

  imageFromBuffer(imgBuffer, options) {
    var o = this._options(options);

    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Image`, Logging.Constants.LogLevel.VERBOSE);
        // Logging.log(o, Logging.Constants.LogLevel.INFO);
        var image = new Image();
        image.dataMode = Image.MODE_IMAGE;
        image.onload = () => {
          Logging.log('Loaded Image', Logging.Constants.LogLevel.VERBOSE);
          context.ctx.drawImage(image, o.left, o.top, o.width, o.height);
          resolve(context);
        };
        image.src = imgBuffer;
      });
    });
  }

  text(text, options) {
    var o = this._options(options);
    this._id += text;

    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Text`, Logging.Constants.LogLevel.VERBOSE);

        Logging.log(o, Logging.Constants.LogLevel.INFO);
        Logging.log(text, Logging.Constants.LogLevel.VERBOSE);

        context.ctx.font = `bold ${options.fontSize}px Replica`;
        context.ctx.fillStyle = o.color;

        if (o.width < this._width) {
          var phrases = this._splitText(context.ctx, text, options.width);
          var top = o.top;
          for (var x = 0; x < phrases.length; x++) {
            context.ctx.save();
            context.ctx.translate(o.left, top + o.fontSize);
            context.ctx.fillText(phrases[x], 0, 0);
            context.ctx.restore();
            top += o.fontSize;
          }
        }

        resolve(context);
      });
    });
  }

  render() {
    var cachedFile = this._cache.tryLoadCachedImage(this._id);
    if (this._noCache || cachedFile === false) {
      return this._doRender();
    }

    return Promise.resolve(fs.createReadStream(cachedFile));
  }

  _options(options) {
    options.top = options.top || 0;
    options.left = options.left || 0;
    options.width = options.width || this._width;
    options.height = options.height || this._height;
    options.width = options.width <= 1 ? this._width * options.width : options.width;
    options.height = options.height <= 1 ? this._height * options.height : options.height;
    return this._applyGravity(options);
  }

  /**
   * @return {Stream} - Readable read stream containing the image data
   * @private
   */
  _doRender() {
    var canvas = new Canvas(this._width, this._height);
    var p = Promise.resolve({canvas: canvas, ctx: canvas.getContext('2d')});

    this._renderQueue.push(context => {
      Logging.log('Render', Logging.Constants.LogLevel.VERBOSE);

      var buffer = canvas.toBuffer();

      var cachedFile = this._cache.addImage(buffer, this._id);
      return Promise.resolve(fs.createReadStream(cachedFile));
    });

    return this._renderQueue.reduce((prev, curr) => {
      return prev.then(curr);
    }, p);
  }

  _splitText(ctx, text, width) {
    var wa = text.split(' ');
    var phrases = [];
    var lastPhrase = wa[0];
    var measure = 0;

    for (var i = 1; i < wa.length; i++) {
      let w = wa[i];
      measure = ctx.measureText(lastPhrase + w).width;
      if (measure < width) {
        lastPhrase += ' ' + w;
      } else {
        phrases.push(lastPhrase);
        lastPhrase = w;
      }
    }

    phrases.push(lastPhrase);

    return phrases;
  }

  _applyGravity(options) {
    var pos = {top: 0, left: 0};
    var topRel = options.top;
    if (/top|bottom/.test(options.gravity)) {
      if (/top/.test(options.gravity) === true) {
        pos.top = 0;
      } else if (/bottom/.test(options.gravity) === true) {
        pos.top = this._height - options.height;
      }
    } else {
      pos.top = (this._height - options.height) / 2;
    }
    pos.top = Math.ceil(pos.top);
    pos.top += topRel;

    var leftRel = options.left;
    if (/left|right/.test(options.gravity)) {
      if (/left/.test(options.gravity) === true) {
        pos.left = 0;
      } else if (/right/.test(options.gravity) === true) {
        pos.left = this._width - options.width;
      }
    } else {
      pos.left = (this._width - options.width) / 2;
    }
    pos.left = Math.ceil(pos.left);
    pos.left += leftRel;

    return Object.assign(options, pos);
  }
}

/**
 *
 */
class Cache {
  constructor() {
    if (!fs.existsSync(Config.imageCachePath)) {
      fs.mkdir(Config.imageCachePath);
    }
  }

  tryLoadCachedImage(options) {
    var filename = this._genFilename(options);
    if (fs.existsSync(`${Config.imageCachePath}/${filename}`)) {
      Logging.log(`Image Cache HIT: ${filename}`, Logging.Constants.LogLevel.INFO);
      return `${Config.imageCachePath}/${filename}`;
    }

    Logging.log(`Image Cache MISS: ${filename}`, Logging.Constants.LogLevel.INFO);

    return false;
  }

  addImage(buffer, id) {
    Logging.log(`Hash Input: ${id}`, Logging.Constants.LogLevel.VERBOSE);
    var filename = this._genFilename(id);
    Logging.log(`Hash Output: ${filename}`, Logging.Constants.LogLevel.VERBOSE);
    fs.writeFileSync(`${Config.imageCachePath}/${filename}`, buffer);
    Logging.log(`Hash Pathname: ${Config.imageCachePath}\\${filename}`, Logging.Constants.LogLevel.VERBOSE);
    return `${Config.imageCachePath}/${filename}`;
  }

  _genFilename(id) {
    var hash = crypto.createHash('sha1');
    return hash.update(id, 'ascii').digest('hex');
  }
}

_cache = new Cache();

/**
 * @class MemCache
 */
class MemCache {
  constructor() {
    this._cache = {};
  }

  load(filename) {
    if (this._cache[filename]) {
      return this._cache[filename];
    }

    this._cache[filename] = fs.readFileSync(filename);
    return this._cache[filename];
  }

  purge(filename) {
    delete this._cache[filename];
  }
}

_memCache = new MemCache();

module.exports = Composer;
