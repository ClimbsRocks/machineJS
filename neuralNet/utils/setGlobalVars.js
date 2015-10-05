var nn = global.neuralNetwork;
var argv = global.argv;

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
  nn.maxChildTrainingTime = argv.maxTrainingTime || 5 * 60; // limiting each child to only be trained for 5 minutes by default.

  // train super quickly if we're developing on ppComplete itself
  if(argv.dev || argv.devKaggle) {
    nn.maxChildTrainingIterations = 5;
  }

  nn.completedNets = 0;
  nn.numOfNetsToTest;

};
