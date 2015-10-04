var fs = require('fs');
var path = require('path');
var csv = require('csv');
var utils = require('./utils.js');
var argv;


module.exports = {
  createEnsemble: function(globalArgs) {
    utils.consolidateFiles(globalArgs, function() {
      // generate the set that is the combination of all the algos we've trained so far
      // iterate through each row
        // for each item in that combination set, run through our whole ensembling logic, calculating the error rate for that row for that particular ensembling method
      // use the best set and ensembling method to calculate scores for each item
      // write to a file. 
    });
  }


}
