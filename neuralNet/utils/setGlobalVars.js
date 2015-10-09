var nn = global.neuralNetwork;
var argv = global.argv;
var path = require('path');

module.exports = function() {

  nn.referencesToChildren = [];
  nn.readyToMakePredictions = false;

  nn.totalRunningNets = 0;
  nn.neuralNetResults = {};

  nn.bestNetObj = {
    trainingBestAsJSON: '',
    testingBestAsJSON: '',
    trainingErrorRate: [Infinity],
    testingError: 1,
    trainingBestTrainingTime: Infinity,
    testingBestTrainingTime: Infinity
  };

  nn.maxChildTrainingIterations = argv.maxTrainingIterations || 100;
  nn.maxChildTrainingTime = argv.maxTrainingTime || 10 * 60; // limiting each child to only be trained for 10 minutes by default.
  nn.minChildTrainingTime = argv.minTrainingTime || 5 * 60; // but also forcing each child to be trained for at least five minutes. allowing a minimum iterations could be disastrous if we have a large data set that takes dozens of minutes or hours to train a single iteration.

  // train super quickly if we're developing on ppComplete itself
  if(argv.dev || argv.devKaggle) {
    nn.maxChildTrainingIterations = 5;
    nn.minChildTrainingTime = 1; //1 second
  }

  nn.completedNets = 0;
  nn.numOfNetsToTest;

};
