var csv = require('csv');
var fs = require('fs');
var path = require('path');
var summary = {};
var ensembleMethods = require('./ensembleMethods.js');

module.exports = {

  consolidateFiles: function(globalArgs, callback) {

    fs.readdir(path.join(globalArgs.ppCompleteLocation,'predictions'), function(err,files) {
      if (err) {
        console.error('there are no files in the "Predictions" folder. We need the predicted output from the classifiers in that folder in order to ensemble the results together. please run this library again, or copy/paste the results into the Predictions folder, to create an ensemble.');
      } else {
        console.log('files from Prections:',files);
        files.forEach(function(fileName) {

          if (fileName.slice(-4).toLowerCase() === 'csv') {
            var filePath = path.join(globalArgs.ppCompleteLocation,'predictions',fileName);
            var firstRow = true;
            var parser = csv.parse({}, function(err, row) {
              if (firstRow) {
                firstRow = false;
                // skip it! 
              } else {
                console.log('row:',row);
                var id = row[0];
                if(summary[id] === undefined) {
                  summary[id] = {};
                }
                summary[id].fileName = row[1];
                
              }
            });
            
            fs.createReadStream(filePath).pipe(parser);
          }

        });
      }
    });
    
  },

  calculateAggregatedPredictions: function(algoNames, bestMethod) {
    var results = [];
    for (var row in summary) {
      // pick out only the predictions from the algos that were selected by createEnsemble:
      var eligiblePredictions = [];
      algoNames.forEach(function(name) {
        eligiblePredictions.push(row[name]);
      });
      // ensemble methods holds all the ways we have of ensembling together the results from different predictions. 
      // each method takes in an array, and returns a single number
      var output = ensembleMethods[bestMethod](eligiblePredictions);
      results.push([row.ID, output]);
    }
    return results;
  },

  writeToFile: function() {

  }
};
