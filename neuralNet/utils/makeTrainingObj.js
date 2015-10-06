var nn = global.neuralNetwork;
var path = require('path');
var argv = global.argv;

module.exports = function ( hlArray) {
  var trainingObj = {
    errorThresh: 0.05,  // error threshold to reach
    iterations: 1000,   // maximum training iterations
    // log: true,           // console.log() progress periodically
    // logPeriod: 1,       // number of iterations between logging
    learningRate: 0.6    // learning rate
  };

  var brainID = ++nn.totalRunningNets;

  // TODO TODO: Finish making argv.copyData functional
  if(argv.copyData) {
    var fileName = '/formattedData' + (brainID % numCPUs) + '.txt';
  } else {
    // TODO: rename this file to make it more user-friendly
    var fileName = 'formattingData3.txt';
  }
  var pathToChildData = path.join(nn.location,fileName);

  var totalMessageObj = {
    type: 'startBrain',
    brainID: brainID,
    hiddenLayers: hlArray, 
    trainingObj: trainingObj, 
    pathToData: pathToChildData, 
    totalRows: nn.dataSummary.totalRows,
    maxTrainingTime: nn.maxChildTrainingTime,
    minTrainingTime: nn.minChildTrainingTime,
    maxTrainingIterations: nn.maxChildTrainingIterations,
  };

  return totalMessageObj;
}
