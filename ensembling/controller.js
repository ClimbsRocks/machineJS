var fs = require('fs');
var path = require('path');
var csv = require('csv');
var utils = require('./utils.js');
var argv;


module.exports = {
  createEnsemble: function(globalArgs) {
    utils.consolidateFiles(globalArgs, function() {
      var results = utils.calculateAggregatedPredictions(['neuralNetwork','randomForest'], 'average');
      console.log('got results back!');
      utils.writeToFile(globalArgs, function() {
        console.log('We have just written the final predictions to a file called "ppCompletePredictions.csv" that is saved at:\n',globalArgs.ppCompleteLocation + '/ppCompletePredictions.csv');
        console.log('Thanks for letting us help you on your machine learning journey! Hopefully this freed up more of your time to do the fun parts of ML. Pull Requests to make this even better are always welcome!');
      }, results);
      // generate the set that is the combination of all the algos we've trained so far
      // iterate through each row
        // for each item in that combination set, run through our whole ensembling logic, calculating the error rate for that row for that particular ensembling method
      // use the best set and ensembling method to calculate scores for each item
      // write to a file. 
    });
  }


}
