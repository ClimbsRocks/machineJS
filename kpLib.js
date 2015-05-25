var brain = require('brain');
var Parallel = require('paralleljs');

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
    console.log('your best net is:', bestNet.jsonBackup);
    var net = new brain.NeuralNetwork();
    return net.fromJSON(bestNet.jsonBackup);
  }
};

var parallelNets = function(hlNum, trainingData) {
  console.log('parallelNets with',hlNum);
  var hlArray = [];
  for(var i = 0; i < hlNum; i++) {
    // TODO: build out logic for how many nodes to put in each hidden layer
    hlArray.push(10);
  }
  console.log('hlArray is:',hlArray);
  var net = new brain.NeuralNetwork({
    hiddenLayers: hlArray, //Use the docs to explore various numbers you might want to use here
    learningRate: 0.6
  });
  var trainingResults = net.train(trainingData, {
    errorThresh: 0.05,  // error threshold to reach
    iterations: 10,   // maximum training iterations
    log: true,           // console.log() progress periodically
    logPeriod: 1,       // number of iterations between logging
    learningRate: 0.3    // learning rate
  });
  //do some kind of returning or result logging
  // capture the final error rate. 
  console.log('trainingResults is:',trainingResults);
  bestNetChecker(trainingResults,net);
};

var bestNetChecker = function(trainingResults,trainedNet) {
  console.log('checking if this is the best net');
  if(trainingResults.error < bestNet.errorRate) {
    //TODO: make this the best net
    bestNet.jsonBackup = trainedNet.toJSON();
    bestNet.errorRate = trainingResults.error;
  }
  //check against our global bestNet
  console.log('bestNet now is:',bestNet);
};

var multipleNetAlgo = function(trainingData) {
  console.log('inside multipleNetAlgo');
  //create logic for training as many nets as we need. 
  for(var i = 2; i > 0; i--) {
    parallelNets(i, trainingData);
  }
};