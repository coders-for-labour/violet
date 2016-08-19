'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file tools.js
 * @description
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var _blockAccounts = (req, res) => {
  if ( !req.user ) {
    res.sendStatus(400);
    return;
  }

  res.json({err:false,res:"Successfully blocked accounts"});
}

module.exports.init = (app) => {
  app.get('/api/v1/twitter/block', _blockAccounts);
}
