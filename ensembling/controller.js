var fs = require('fs');
var path = require('path');
var csv = require('csv');
var utils = require('./utils.js');
var argv;


module.exports = {
  createEnsemble: function(globalArgs) {
    utils.consolidateFiles(globalArgs);
  }


}
