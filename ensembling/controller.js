var fs = require('fs');
var path = require('path');
var utils = require('./utils.js');
var argv;


module.exports = {
  createEnsemble: function(globalArgs) {
    // generateSummary reads in the prediction files from each classifier, and loads them into an in-memory object that matches them all up by rowID. 
    utils.generateSummary(globalArgs, function() {

      // FUTURE: 
        // 1. Test all combinations of number of classifiers among the ones we've trained
          // 2. for each combination of classifiers, run every single one of our ensembling methods
          // 3. pick the [combination of classifiers, ensembling method] pair that has the lowest error rate across the data set

      // for now, we are just going to use all classifiers that we have trained. that means the python classifiers listed at ppComplete/pySetup/classifierList.js, as well as the neueralNetwork trained in a separate module within ppComplete.
      var allClassifierList = require(path.join(globalArgs.ppCompleteLocation,'pySetup','classifierList.js'));
      allClassifierList.neuralNetwork = 'neuralNetwork';

      // calculateAggregatedPredictions uses the best combination of classifiers and ensembling method to create our final prediction. 
      // until we are ready for our version 3.0 release, we will simply pass it all of our classifiers, with the ensemble method of bagging them together. 
      var results = utils.calculateAggregatedPredictions(allClassifierList, 'average');
      
      utils.writeToFile(globalArgs, function() {
        console.log('We have just written the final predictions to a file called "ppCompletePredictions.csv" that is saved at:\n',globalArgs.ppCompleteLocation + '/ppCompletePredictions.csv');
        console.log('Thanks for letting us help you on your machine learning journey! Hopefully this freed up more of your time to do the fun parts of ML. Pull Requests to make this even better are always welcome!');
        process.emit('killAll');
      }, results);
      // generate the set that is the combination of all the algos we've trained so far
      // iterate through each row
        // for each item in that combination set, run through our whole ensembling logic, calculating the error rate for that row for that particular ensembling method
      // use the best set and ensembling method to calculate scores for each item
      // write to a file. 
    });
  },
  startListeners: function(numOfAlgosToWaitOn, globalArgs) {
    var finishedAlgos = 0;
    process.on('algoFinishedTraining', function() {
      finishedAlgos++;
      if(finishedAlgos === numOfAlgosToWaitOn - 1) {
        // tell the neural net it's time to turn off the light, stop reading, and go to bed. 
        // the neural net is going to train itself until all the other processes have finished, that way it is as accurate as possible
        process.emit('stopTraining');
      } else if( finishedAlgos === numOfAlgosToWaitOn ) {
        module.exports.createEnsemble(globalArgs);
      }
    });

  }


}
