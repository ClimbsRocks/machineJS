var nn = global.neuralNetwork;
var path = require('path');
var argv = global.argv;

module.exports = function ( hlArray) {

  // NOTE: these are the max training time parameters we can set. we will use other processes to decide when to kill off the net. 
  var trainingObj = {
    errorThresh: 0.0,  // error threshold to reach
    iterations: 20000,   // maximum training iterations
    // log: true,           // console.log() progress periodically
    // logPeriod: 1,       // number of iterations between logging
    learningRate: 0.6    // learning rate
  };

  var brainID = nn.bestNetObj.brainID;

  var fileName = 'formattingData3.txt';

  var pathToChildData = path.join(nn.location,fileName);

  var totalMessageObj = {
    type: 'startBrain',
    brainID: brainID,
    hiddenLayers: nn.bestNetObj.hiddenLayers, 
    trainingObj: trainingObj, 
    pathToData: pathToChildData, 
    totalRows: nn.dataSummary.totalRows,
    maxTrainingTime: Infinity,
    maxTrainingIterations: Infinity
  };

  return totalMessageObj;
}
