var brain = require('brain');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var kpCompleteLocation = '/Users/preston/ghLocal/machineLearningWork/kpComplete'
var readAndFormatData = require(path.join(kpCompleteLocation,'readAndFormatData.js'));

console.log('numCPUs:',numCPUs);

var bestNet = {
  jsonBackup: '',
  errorRate: 1,
  trainingTime: Infinity
};

var globalTrainingData = [];

var dataSummary; // this will eventually be set equal to what readAndFormatData gives us.

module.exports = {

  train: function(trainingData) {
    // open a writeStream
    var writeStream = fs.createWriteStream('inputData.txt',{encoding: 'utf8'});

    // This writes larger chunks of data to the writeStream at a time, which signgificantly improved performance over writing each line and each newline character individually.
    // We are open to pull requests if anyone wants to optimize this further. 
    for(var i = 0; i < trainingData.length; i+=10) {
      var writeString = '';
      for(var j = 0; j < 10; j++) {
        if(i + j < trainingData.length) {
          writeString += JSON.stringify(trainingData[i + j]) + '\n';
          // TODO: give the user the option of keeping the data in memory. Since this is passed around by reference, we're actually overwriting the original data. This is low priority. 
          // set all data equal to null to free up space in RAM. 
          trainingData[i + j] = null;          
        }
      }
      writeStream.write(writeString);
      writeString = '';
    }

    writeStream.on('drain', function() {
      writeStream.end();
    });

    writeStream.on('finish', function() {

      console.log('finished writing the data to a file');
      trainingData = null; //make sure to no longer point any variables to our trainingData, in case any still exists. 

      multipleNetAlgo();

    });
  }
};

var totalRunningNets = 0;
var neuralNetResults = {};

var allParamsToTest = [];
// we will invoke this when we call parallelNets for the first time
function createParams(maxLayers, maxNodesMultiplier) {

  function createOneParamArray(numLayers,numNodes) {
    var outputArr = [];
    for (var i = 0; i < numLayers; i++) {
      outputArr.push(numNodes * dataSummary.numFeatures); //multiply this by the number of features. 
    }
    return outputArr;
  };

  // create nets with up to maxLayers hidden layers
  for (var i = 1; i <= maxLayers; i++) {
    // create nets with up to maxNodesMultiplier * the number of features in the dataset
    for (var j = 1; j < maxNodesMultiplier; j++) {
      allParamsToTest.push(createOneParamArray(i,j));
    }
  }
}

// TODO: this is incomplete. 
var netCheckup = function() {
  // if all nets have reached 100 iterations
    // start a new series of nets with different params to canvas the space
    // if we have X many nets over 100 iterations:
      // figure out which one is best, and then create new nets that are smaller iterations from there

}

var updateNetStatus = function(message) {
  var id = message.brainID;
  neuralNetResults[id].iterations = message.iterations;
  neuralNetResults[id].trainingErrorRate = message.errorRate;
  neuralNetResults[id].net = message.net;
}

var parallelNets = function() {
  // Nets we want to test:
  // 1. hidden layers: 1 - 10
    // most likely, we'll settle on something like 1-3 hidden layers, but it's fun to try them all
  // 2. nodes per hidden layer: (0.5 - 100) * numFeatures
  createParams(10,10);


  var child_process = require('child_process'); //this is node's built in module for creating new processes. 

  // create a new child_process for all but one of the cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {

    // create an IIFE so that we have a variable pointing to each individual child. 
    (function(i) {
      // TODO: this might be the only place we need to make a change between streaming and passing in the whole dataset
      // var child = child_process.fork('./brainChild',{cwd: kpCompleteLocation});
      var child = child_process.fork('./brainChildMemoryHog',{cwd: kpCompleteLocation});
      var messageObj = makeTrainingObj( allParamsToTest.unshift() );

      child.send(messageObj);

      var netTrackingObj = {
        hiddenLayers: messageObj.hiddenLayers,
        learningRate: messageObj.trainingObj.learningRate,
        iterations: 0,
        trainingErrorRate: Infinity,
        net: undefined,
        testingErrorRate: Infinity,
        status: 'running'
      };

      if(neuralNetResults[messageObj.brainID] === undefined) {
        neuralNetResults[messageObj.brainID] = netTrackingObj;
      } else {
        console.log('we already have a net at this property:',messageObj.brainID);
        console.log('other brain info:',messageObj);
      }

      child.on('message', function(message) {

        var id = message.brainID;
        if(message.type === 'finishedTraining') {
          updateNetStatus(message);
          neuralNetResults[id].running = false;

          var net = new brain.NeuralNetwork();
          testOutput(net.fromJSON(message.net));
          // KATRINA: we have completed training on a new net. here's where you'll invoke a functoin to check those results against our current results, and then spin up a new new to test. 
          // TODO: start a new child process after doing some logic
          // TODO: send training data back to the parent on each iteration (ideally, every 100 iterations or every 10 minutes)
          // TODO: have some way of timeboxing each experiment??
          
          // trying to share data between parent and child efficiently here by sending it as messages. 
          // this was slow, but as long as it's predictably slow, we can work around it (grab new data when only half drained, etc.)
        } else if (message.type === 'getNewData') {
          child.send(globalTrainingData.slice(message.rowsSoFar, message.rowsSoFar + 10000));
        } else if (message.type === 'midTrainingCheckIn'){
          // TODO: build in logic to make this time based as well as iteration based. 
          updateNetStatus(message);
          if(message.iterations === 100) {
            // TODO: we're going to have to generalize this
            netCheckup();
          }
        } else {
          console.log('heard a message in parent and did not know what to do with it:',message);
        }
      });
      
    })(i);
  }

};

var testOutput = function(net) {

  var testSummary = {};
  for (var i = 0; i <= 100; i++) {
    testSummary[i] = {
      countOfPredictionsAtThisProbability: 0,
      observedValues: 0
    };
  }
  var readStream = fs.createReadStream(path.join(kpCompleteLocation,'/formattedData0.txt'), {encoding: 'utf8'});
  readStream._partialLineData = '';

  readStream.on('data', function(data) {
    data = this._partialLineData + data;
    var rows = data.toString().split('\n');
    this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

    for (var j = 0; j < rows.length; j++) {
      var row = JSON.parse(rows[j]);
      if(row.testingDataSet) {
        var nnPrediction = Math.round(net.run(row.input).numericOutput * 100);
        testSummary[nnPrediction].countOfPredictionsAtThisProbability++;
        // TODO: make this work for categorical output too. right now it only works for numeric output. 
        testSummary[nnPrediction].observedValues += parseFloat(row.output.numericOutput, 10);
      }
    }
  });

  readStream.on('end', function() {
    for(var key in testSummary) {
      console.log(key, 'count:', testSummary[key].countOfPredictionsAtThisProbability, 'rate:', Math.round(testSummary[key].observedValues / testSummary[key].countOfPredictionsAtThisProbability * 100) + '%');
    }
  });
};

var bestNetChecker = function(trainingResults,trainedNet) {
  console.log('checking if this is the best net');
  if(trainingResults.error < bestNet.errorRate) {
    // make this the best net
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

function makeTrainingObj (hlArray) {
  var trainingObj = {
    errorThresh: 0.052,  // error threshold to reach
    iterations: 1000,   // maximum training iterations
    log: true,           // console.log() progress periodically
    logPeriod: 1,       // number of iterations between logging
    learningRate: 0.6    // learning rate
  };

  var brainID = ++totalRunningNets;

  var fileName = '/formattedData' + (brainID % numCPUs) + '.txt';
  var pathToData = path.join(kpCompleteLocation,fileName);

  var totalMessageObj = {
    type: 'startBrain',
    brainID: brainID,
    hiddenLayers: hlArray, 
    trainingObj: trainingObj, 
    pathToData: pathToData, 
    totalRows: totalRows
  };

  return totalMessageObj;
}

var multipleNetAlgo = function() {
  // TODO: 
    // nest everything inside a recursive function
    // that function will recurse until we've covered the entire space and converged on an answer
    // each iteration will create a new set of params we want to test against
    // we will then invoke parallelNets, which will take in an array of params we want to try, and return a promise. 
    // once we get the promise back, we'll invoke the recursive function again
    // that recursive function will then perform some logic, find a new set of params to train against, and then invoke parallelNets...
    // Yeah, Katrina for sure gets the challenging part. 
    // That'll be a ton of fun for her :)

  //create logic for training as many nets as we need. 
  var allParamComboArr = [];
  for(var i = numCPUs; i > 0; i--) {

    var hlArray = [];
    for (var j = 0; j < i; j++) {
      hlArray.push(10);
    }

    var trainingObj = {
      errorThresh: 0.052,  // error threshold to reach
      iterations: 1000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 1,       // number of iterations between logging
      learningRate: 0.6    // learning rate
    };

    var fileName = '/formattedData' + (i - 1) + '.txt';
    var pathToData = path.join(kpCompleteLocation,fileName);

    allParamComboArr.push({hiddenLayers: hlArray, trainingObj: trainingObj, pathToData: pathToData, totalRows: totalRows});
  }

  parallelNets(allParamComboArr);
};

// Here is where we invoke the method with the path to the data
readAndFormatData(path.join(kpCompleteLocation,'./kaggle2.csv'), function(formattingSummary) {
  dataSummary = formattingSummary;
  parallelNets();
});

