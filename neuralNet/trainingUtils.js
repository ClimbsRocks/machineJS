var path = require('path');
var nnLocation = path.dirname(__filename);


module.exports = {
  createParamsToTest: function (numFeatures, argv) {
    var allParamsToTest = [];
    // TODO: double this and have it for a variety of trainingRates. 
  // ADVANCED: figure out some way of having fewer than 1 times the number of features as the node for each hidden layer. 
    // e.g., DilMil where we pruned out any feature that wasn't present in at least 1% of the dataset. 
      // technically, I grouped all those features together into something like "column5RareFeature = 1"
    var layersArray = [1,2,3,6,10];
    var nodesArray = [1,2,5,10,50,100];

    function createOneParamArray(numLayers,numNodes) {
      var outputArr = [];
      for (var i = 0; i < numLayers; i++) {
        outputArr.push(numNodes * numFeatures); //multiply this by the number of features. 
      }
      return outputArr;
    }

  // creates nodesArray.length nets for each item in layersArray
    for (var i = 0; i < layersArray.length; i++) {
      // create nets with up to nodesArray[i] * the number of features in the dataset
      for (var j = 0; j < nodesArray.length; j++) {
        allParamsToTest.push(createOneParamArray(layersArray[i],nodesArray[j]));
      }
    }
    numOfNetsToTest = allParamsToTest.length;
    // if this is dev or devKaggle, we only want to test the largest and smallest nets (2 total)
    if(argv.dev || argv.devKaggle) {
      var tempParamsToTest = [];
      tempParamsToTest.push(allParamsToTest.shift());
      tempParamsToTest.push(allParamsToTest.pop());
      allParamsToTest = tempParamsToTest;
    }
    console.log('allParamsToTest:',allParamsToTest);
    return allParamsToTest;
  },

  makeTrainingObj: function (argv, dataSummary, trainingArgs) {
    var trainingObj = {
      errorThresh: 0.05,  // error threshold to reach
      iterations: 1000,   // maximum training iterations
      // log: true,           // console.log() progress periodically
      // logPeriod: 1,       // number of iterations between logging
      learningRate: 0.6    // learning rate
    };

    var brainID = ++trainingArgs.totalRunningNets;

    // TODO TODO: Finish making argv.copyData functional
    if(argv.copyData) {
      var fileName = '/formattedData' + (brainID % numCPUs) + '.txt';
    } else {
      // TODO: rename this file to make it more user-friendly
      var fileName = 'formattingData3.txt';
    }
    var pathToChildData = path.join(nnLocation,fileName);

    var totalMessageObj = {
      type: 'startBrain',
      brainID: brainID,
      hiddenLayers: trainingArgs.hlArray, 
      trainingObj: trainingObj, 
      pathToData: pathToChildData, 
      totalRows: dataSummary.totalRows,
      maxTrainingTime: trainingArgs.maxChildTrainingTime,
      maxTrainingIterations: trainingArgs.maxChildTrainingIterations,
      totalRunningNets: trainingArgs.totalRunningNets
    };

    return totalMessageObj;
  }
}
