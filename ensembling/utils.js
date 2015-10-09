var fs = require('fs');
var path = require('path');
var byline = require('byline');
var summary = {};
var ensembleMethods = require('./ensembleMethods.js');
var csv = require('fast-csv');

module.exports = {

  generateSummary: function(globalArgs, callback) {

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

            var pipingStream = byline(fs.createReadStream(filePath, {encoding: 'utf8'}));
            
            pipingStream.on('data', function(str) {
              var row = str.split(',');
              if (firstRow) {
                firstRow = false;
                // skip it! 
              } else {
                // the id is stored in the first column
                var id = row[0];
                if(summary[id] === undefined) {
                  summary[id] = {};
                }
                // the predicted values might have gotten saved as strings when we want them to be numbers. if so, convert them to numbers here.
                if(parseFloat(row[1]) !== NaN) {
                  row[1] = parseFloat(row[1]);
                }

                //the prediction is stored in the second column
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
            // if the file is not a .csv file, we will ignore it, and remove it from our count of files to parse
            fileCount--;
          }

        });
      }
      // handles off by one errors
      if(fileCount === 0) {
        callback();
      }


    });
    
  },

  calculateAggregatedPredictions: function(classifierNames, bestMethod) {
    var predictionCalculation = ensembleMethods[bestMethod];
    var results = [];
    results.push(['PassengerID','Survived']);
    for (var rowNum in summary) {
      // console.log('row:',row);
      // pick out only the predictions from the algos that were selected by createEnsemble:
      var eligiblePredictions = [];

      // classifierNames is a key-mirror object where each key and value are both the classifierName
      for (var classifierName in classifierNames) {
        eligiblePredictions.push(summary[rowNum][classifierName]);
      }
      // ensembleMethods holds all the ways we have of ensembling together the results from different predictions. 
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
