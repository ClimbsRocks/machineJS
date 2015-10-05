var fs = require('fs');
var brain = require('brain');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var nnLocation = path.dirname(__filename);
var readAndFormatData = require(path.join(nnLocation,'readAndFormatData.js'));
var dataFile;
// var advancedOptions = process.argv[3] || {};
var argv = require('minimist')(process.argv.slice(2));
var trainingUtils = require('./trainingUtils.js');
var makeKagglePredictions = require('./makeKagglePredictions.js');
var EventEmitter = require('events');


module.exports = {
  killAll: function() {
    for(var i = 0; i < referencesToChildren.length; i++) {
      referencesToChildren[i].kill();
    }
  },
  startTraining: function(argsFromppLib) {
    argv = argsFromppLib;
    console.log('dataFile:',argv.dataFile);
    // Here is where we invoke the method with the path to the data
    // we pass in a callback function that will make the dataSummary a global variable 
      // and invoke parallelNets once formatting the data is done. 

    readAndFormatData(nnLocation, argv.dataFile, function(formattingSummary) {
      dataSummary = formattingSummary;
      parallelNets();
    });

  }
}



// TODO: graph the error rates! 
  // on each iteration, push the error rate into an array for that net. 
  // then, simply go through and graph them all. 
  // over time, we can build in a nice dashboard (select the num of hidden layers, select the num of nodes per hidden layer, etc.)
  // goal: to see if there's much of a difference between the different nets
    // to see if we should keep training the nets for longer
    // to see if we should have killed off training a certain net even more quickly
    // because it's cool :) and it will give the user something to look at while their nets are training. it's a good status update. 

// TODO: nest most console logs inside a check for --dev (or --verbose?)
// TODO: build out --devKaggle


var bestNetObj = {
  trainingBestAsJSON: '',
  testingBestAsJSON: '',
  trainingErrorRate: [Infinity],
  testingError: 1,
  trainingBestTrainingTime: Infinity,
  testingBestTrainingTime: Infinity
};

var globalTrainingData = [];

// we will get dataSummary from readAndFormatData()
var dataSummary; 
var readyToMakePredictions = false;

var totalRunningNets = 0;
var neuralNetResults = {};


var updateNetStatus = function(message) {
  // console.log('message inside updateNetStatus',message);
  var id = message.brainID;
  neuralNetResults[id].iterations = message.iterations;
  neuralNetResults[id].trainingErrorRate.push(message.errorRate);
  neuralNetResults[id].net = message.net;
}

var createChild = function() {
  var child_process = require('child_process'); //this is node's built in module for creating new processes. 
  // TODO: this might be the only place we need to make a change between streaming and passing in the whole dataset
  // FUTURE: see if we can increase the max memory size for each child process, as we would with node "--max-old-space-size= 4000" to signify a ~4GB RAM limit. 
    // NOTE: different computers handle that command as either bytes or megabytes. be careful. 
  if(argv.useStreams) {
    var child = child_process.fork('./brainChildStream',{cwd: nnLocation});
  } else {
    var child = child_process.fork('./brainChildMemoryHog',{cwd: nnLocation});
  }

  // if this is a dev run, we only want to train two nets (the smallest and largest configurations). otherwise, we want to test all configurations. 
  var messageObj = makeTrainingObj( allParamsToTest.shift() );

  child.send(messageObj);

  var netTrackingObj = {
    hiddenLayers: messageObj.hiddenLayers,
    learningRate: messageObj.trainingObj.learningRate,
    iterations: 0,
    trainingErrorRate: [],
    net: undefined,
    testingErrorRate: Infinity,
    running: true
  };

  if(neuralNetResults[messageObj.brainID] === undefined) {
    neuralNetResults[messageObj.brainID] = netTrackingObj;
  } else {
    console.log('we already have a net at this property:',messageObj.brainID);
    console.log('other brain info:',messageObj);
  }

  return child;
}

var completedNets = 0;
var numOfNetsToTest;

function attachListeners(child) {
  child.running = true;
  child.startTime = Date.now();
  child.on('message', function(message) {
    var id = message.brainID;
    if(message.type === 'finishedTraining') {
      updateNetStatus(message);
      neuralNetResults[id].running = false;
      child.running = false;
      child.endTime = Date.now();
      completedNets++;
      // Or maybe we don't have to kill it, we can just send it new information to train on?!
      child.kill();
      //TODO: send over a better message to bestNetChecker. 
      bestNetChecker(message); 

      // var net = new brain.NeuralNetwork();
      // testOutput(net.fromJSON(message.net));
      // TODO: have some way of timeboxing each experiment??

      if(allParamsToTest.length > 0) {
        console.log('trained', totalRunningNets - (numCPUs - 1) ,'so far,', numOfNetsToTest - completedNets, "still learning everything it can about your dataset in it's quest to be your best neural net ever!");
        var newChild = createChild();
        attachListeners(newChild);
        referencesToChildren.push(newChild);
      } else if (completedNets === numOfNetsToTest) {
        console.log('done training all the neural nets you could conjure up!');
        // this is a flag to warn the user that we're still training some nets if they try to access the results before we're finished
        readyToMakePredictions = true;
        // TODO TODO: load up the bestNet
          // train it for a longer period of time (10 minutes by default, but let the user specify this eventually)
          // once we have reached that threshold, only then run makeKagglePredictions
        var extendedTrainingNet = new brain.NeuralNetwork();
        // extendedTrainingNet.fromJSON(bestNetObj.trainingBestAsJSON);
        // extendedTrainingNet.train();


        if(argv.kagglePredict || argv.devKaggle) {
          makeKagglePredictions( argv.kagglePredict, dataSummary, argv.ppCompleteLocation, bestNetObj );
        }
      } 
      
    } else if (message.type === 'getNewData') {
      // trying to share data between parent and child efficiently here by sending it as messages. 
      // this was slow, but as long as it's predictably slow, we can work around it (grab new data when only half drained, etc.)
      child.send(globalTrainingData.slice(message.rowsSoFar, message.rowsSoFar + 10000));
    } else if (message.type === 'midTrainingCheckIn'){
      // TODO: build in logic to make this time based as well as iteration based. 
      updateNetStatus(message);
      if(message.iterations === 100) {
        // TODO: we're going to have to generalize this
        netCheckup();
      }
      bestNetChecker(message);
    } else {
      console.log('heard a message in parent and did not know what to do with it:',message);
    }
  });
}

var referencesToChildren = [];

var allParamsToTest; 
// we will invoke this when we call parallelNets for the first time

var parallelNets = function() {
  // Nets we want to test:
  // 1. hidden layers: 1 - 10
    // most likely, we'll settle on something like 1-3 hidden layers, but it's fun to try them all
  // 2. nodes per hidden layer: (0.5 - 100) * numFeatures
  allParamsToTest = trainingUtils.createParamsToTest(dataSummary.numFeatures, argv);
  numOfNetsToTest = allParamsToTest.length;
  console.log('numOfNetsToTest:', numOfNetsToTest);

  // create a new child_process for all but one of the cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {
    // wrapping this in an IIFE so each child is available in it's own scope
    // if we still have something left to test, create a new child!
    if(allParamsToTest.length) {
      (function() {
        var child = createChild();
        attachListeners(child);
        referencesToChildren.push(child);
      })();
      
    }
  }

};

// FUTURE: stop training once the deltas between iterations have decreased to be only x% of what they were for the first three iterations. 
  // say the error for the first three iterations decreases from .065 to .055, that would be a delta of -.010. That means an average delta of roughly -.003 for each of those iterations.
  // as soon as we reach a point where each training iteration is only giving us a delta of, say, one tenth of that, or -.0003, we stop the training, basically saying it's inefficient. 
  // The great part about this is that it's all relative. So we wouldn't hold a net with a training rate of .3 to the same absolute standard as a net with a trainingRate of .9. 

// CLEAN: I don't think we need any of the following code anymore, now that we're just sending in maxChildTrainingTime and maxChildTrainingIterations as parameters to the child process. 
var maxChildTrainingTime = argv.maxTrainingTime || 5 * 60; // limiting each child to only be trained for 5 minutes by default.
// console.log('advancedOptions:',advancedOptions);
var maxChildTrainingIterations = argv.maxTrainingIterations || 100;
if(argv.dev || argv.devKaggle) {
  maxChildTrainingIterations = 1;
}
// ADVANCED: let them specify a total training time, and then we'll guesstimate how long each child has to train from there

// var trainingCuller = function() {
//   // console.log('referencesToChildren:', referencesToChildren);
//   for (var i = 0; i < referencesToChildren.length; i++) {
//     var child = referencesToChildren[i];
//     if(child.running) {
//       var elapsedTrainingTime = (Date.now() - child.startTime) / 1000; // time is in milliseconds. elapsedTrainingTime is now in seconds.
//       if(elapsedTrainingTime > maxChildTrainingTime *1.2) {
//         // we are having the child auto-kill itself when it reaches a good stopping point (the next iteration)
//         // however, in the case that the iteration is taking too long, we are back-stopping it here by killing the child if it's been running 20% longer than the max allowed time. 
//         // there's a whole shutdown process to follow. 
//         // TODO: modularize the child shutdown process and then include it here.
//         child.running = false;
//         console.log('sent a kill message');
//         child.kill();

//         // kill the child
//         // follow the same steps as we would when the child finishes training naturally.
//       }
//     }
//   }
// };

// ADVANCED: kill off some nets more quickly if we see that they're behind where other nets were after 200 iterations, and the delta between their iterations is smaller than other nets. 

// TODO: run this once every minute, or on some less-frequent basis. 
// var killNetChildInterval = setInterval(function() {
//   trainingCuller();
// }, 1000);

var testOutput = function(net) {

  var testSummary = {};
  for (var i = 0; i <= 100; i++) {
    testSummary[i] = {
      countOfPredictionsAtThisProbability: 0,
      observedValues: 0
    };
  }
  // right now we're just reading in the entire training set. 
  // TODO: test on only the held-back portion of the input data.
  var readStream = fs.createReadStream(path.join(nnLocation,'/formattedData0.txt'), {encoding: 'utf8'});
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

  // TODO: turn this into a single error number, rather than the human-readable output below.
  readStream.on('end', function() {
    for(var key in testSummary) {
      console.log(key, 'count:', testSummary[key].countOfPredictionsAtThisProbability, 'rate:', Math.round(testSummary[key].observedValues / testSummary[key].countOfPredictionsAtThisProbability * 100) + '%');
    }
  });
};

var mostRecentWrittenNet = Date.now();
var namesOfWrittenNets = [];
var bestNetChecker = function(trainingResults) {
  // console.log('checking if this is the best net:',trainingResults);
  // bestNetObj.trainingErrorRate is an array of all the error rates it has had along the way. We want the most recent one. 
  if(trainingResults.errorRate < bestNetObj.trainingErrorRate[bestNetObj.trainingErrorRate.length -1]) {
    // console.log('trainingResults:',trainingResults);
    // console.log('trainingResults.net:',trainingResults.net);
    // make this the best net
    bestNetObj.trainingBestAsJSON = JSON.stringify(trainingResults.net);
    // we will have many new bestNets on our first training round. This prevents us from having too many new files created
    // Admittedly, this is potentially still creating a new net every three seconds, which is a lot.
    // The risk we're running right now is simply that we lose three seconds worth of work. The worst case scenario is that we write the most recent net to file, and then 2.9 seconds later, we simultaneously get a new best net, don't write it to file, and then close out the server for some reason, forever losing that last net. This seems a small risk. 
    if(completedNets > 0 || Date.now() - mostRecentWrittenNet > 3000 || trainingResults.type === 'finishedTraining') {
      var bestNetFileName = 'neuralNet/bestNet/bestNet' + Date.now() + '.txt';
      namesOfWrittenNets.push(bestNetFileName);
      fs.writeFile(bestNetFileName, bestNetObj.trainingBestAsJSON, function() {
        // delete the previously written bestNet file(s), now that we have a new one written to disk successfully. 
        while(namesOfWrittenNets.length > 1) {
          fs.unlink(namesOfWrittenNets.shift());
        }
      });
      mostRecentWrittenNet = Date.now();
    }
    // TODO: grab the entire array
    bestNetObj.trainingErrorRate = neuralNetResults[trainingResults.brainID].trainingErrorRate;
    bestNetObj.trainingBestTrainingTime = trainingResults.trainingTime;
    bestNetObj.iterations = trainingResults.iterations;
  }
};

function makeTrainingObj (hlArray) {
  var trainingObj = {
    errorThresh: 0.05,  // error threshold to reach
    iterations: 1000,   // maximum training iterations
    // log: true,           // console.log() progress periodically
    // logPeriod: 1,       // number of iterations between logging
    learningRate: 0.6    // learning rate
  };

  var brainID = ++totalRunningNets;

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
    hiddenLayers: hlArray, 
    trainingObj: trainingObj, 
    pathToData: pathToChildData, 
    totalRows: dataSummary.totalRows,
    maxTrainingTime: maxChildTrainingTime,
    maxTrainingIterations: maxChildTrainingIterations
  };

  return totalMessageObj;
}
