var fs = require('fs');
var path = require('path');
var byline = require('byline');
var summary = {};
var ensembleMethods = require('./ensembleMethods.js');
var csv = require('fast-csv');

module.exports = {

  consolidateFiles: function(globalArgs, callback) {

    fs.readdir(path.join(globalArgs.ppCompleteLocation,'predictions'), function(err,files) {
      if (err) {
        console.error('there are no files in the "Predictions" folder. We need the predicted output from the classifiers in that folder in order to ensemble the results together. please run this library again, or copy/paste the results into the Predictions folder, to create an ensemble.');
        callback();
      } else {
        var fileCount = files.length;
        var finishedFiles = 0;
        files.forEach(function(fileName) {

          if (fileName.slice(-4).toLowerCase() === '.csv') {
            var prettyFileName = fileName.slice(0,-4);
            var filePath = path.join(globalArgs.ppCompleteLocation,'predictions',fileName);
            var firstRow = true;

            var pipingStream = byline(fs.createReadStream(filePath, {encoding: 'utf8'})); //.pipe(parser);
            
            pipingStream.on('data', function(str) {
              var row = str.split(',');
              if (firstRow) {
                firstRow = false;
                // skip it! 
              } else {
                var id = row[0];
                if(summary[id] === undefined) {
                  summary[id] = {};
                }
                // the predicted values might have gotten saved as strings when we want them to be numbers. if so, convert them to numbers here.
                if(parseFloat(row[1]) !== NaN) {
                  row[1] = parseFloat(row[1]);
                }
                summary[id][prettyFileName] = row[1];
                
              }
            });

            pipingStream.on('end', function() {
              finishedFiles++;
              if(finishedFiles === fileCount) {
                callback();
              }
            });
          } else {
            fileCount--;
          }

        });
      }
      if(fileCount === 0) {
        callback();
      }


    });
    
  },

  calculateAggregatedPredictions: function(algoNames, bestMethod) {
    var predictionCalculation = ensembleMethods[bestMethod];
    var results = [];
    results.push(['ID','Probability']);
    for (var rowNum in summary) {
      // console.log('row:',row);
      // pick out only the predictions from the algos that were selected by createEnsemble:
      var eligiblePredictions = [];
      algoNames.forEach(function(name) {
        eligiblePredictions.push(summary[rowNum][name]);
      });
      // ensemble methods holds all the ways we have of ensembling together the results from different predictions. 
      // each method takes in an array, and returns a single number
      var output = ensembleMethods[bestMethod](eligiblePredictions);
      results.push([rowNum, output]);
    }
    return results;
  },

  writeToFile: function(globalArgs, callback, results) {
    csv.writeToPath(path.join(globalArgs.ppCompleteLocation, 'ppCompletePredictions.csv'), results)
    .on('finish',function() {
      callback();
    });
  }
};
