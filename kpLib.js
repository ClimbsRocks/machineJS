var brain = require('brain');
var Threads = require('webworker-threads');

var bestNet = {
  jsonBackup: '',
  errorRate: 1,
  trainingTime: Infinity
};

module.exports = {
  train: function(trainingData) {
    multipleNetAlgo(trainingData);
    // return the net itself
    // var net = kpComplete.train(trainingData); should be something they can type in. 
    // and then we'd return the fully trained net. 
    // because we can get a net from JSON. so let's do that and then return it. 
    // TODO: investigate if we need to give them a callback. does this become asynch with paralleljs?
    // console.log('your best net is:', bestNet.jsonBackup);
    // var net = new brain.NeuralNetwork();
    // return net.fromJSON(bestNet.jsonBackup);
    // TODO: return asynchronously. Maybe promisify multipleNetAlgo??
      // 
  }
};

// var parallelNets = function(hlNum, trainingData) {
//   console.log('parallelNets with',hlNum);
//   var hlArray = [];
//   for(var i = 0; i < hlNum; i++) {
//     // TODO: build out logic for how many nodes to put in each hidden layer
//     hlArray.push(10);
//   }
//   console.log('hlArray is:',hlArray);
//   var net = new brain.NeuralNetwork({
//     hiddenLayers: hlArray, //Use the docs to explore various numbers you might want to use here
//     learningRate: 0.6
//   });
//   var trainingResults = net.train(trainingData, {
//     errorThresh: 0.05,  // error threshold to reach
//     iterations: 10,   // maximum training iterations
//     log: true,           // console.log() progress periodically
//     logPeriod: 1,       // number of iterations between logging
//     learningRate: 0.3    // learning rate
//   });
//   //do some kind of returning or result logging
//   // capture the final error rate. 
//   console.log('trainingResults is:',trainingResults);
//   bestNetChecker(trainingResults,net);
// };

// var trainParallelNets = function(netParams, trainingData) {
//   var thread = Threads.create();

//   // TODO: I may need to move the net itself into the worker function??
//   var net = new brain.NeuralNetwork({
//     hiddenLayers: netParams.hiddenLayers
//   });

//   function testFunc() {
//     console.log('i am inside the thread!');
//     console.log('net is:', net);
//     return 'returned val from testFunc';
//   };

//   thread.eval(net)
//   thread.eval(testFunc);
//   thread.eval('testFunc()', function(err, result) {
//     if (err) throw err;
//     console.log(result);
//   });
// };


var bestNetChecker = function(trainingResults,trainedNet) {
  console.log('checking if this is the best net');
  if(trainingResults.error < bestNet.errorRate) {
    //TODO: make this the best net
    bestNet.jsonBackup = trainedNet.toJSON();
    bestNet.errorRate = trainingResults.error;
  }
  //check against our global bestNet
  console.log('bestNet now is:',bestNet);
  // TODO: build in logic to see if we've trained all the nets
  // TODO: more logging, perhaps? Let the user know once every 5 nets that something's going on?
  // TODO: write each new bestNet to a file. 
    // TODO: figure out how to not fail if the user stops the program mid-file-write
      // I'm thinking we write to a backup file first, then overwrite the main file, or rename the backup file to be the same name as the main file. 
};

var multipleNetAlgo = function(trainingData) {
  console.log('inside multipleNetAlgo');
  //create logic for training as many nets as we need. 
  for(var i = 2; i > 0; i--) {

    var hlArray = [];
    for (var j = 0; j < i; j++) {
      hlArray.push(10);
    }

    var trainingObj = {
      errorThresh: 0.05,  // error threshold to reach
      iterations: 10,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 1,       // number of iterations between logging
      learningRate: 0.3    // learning rate
    };

    trainParallelNets({hiddenLayers: hlArray, trainingObj: trainingObj}, trainingData);
  }
};