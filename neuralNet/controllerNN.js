var fs = require('fs');
var brain = require('brain');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var nn = global.neuralNetwork;
nn.location = path.dirname(__filename);
var readAndFormatData = require(path.join(nn.location,'readAndFormatData.js'));
var argv = global.argv;
var trainingUtils = require('./trainingUtils.js');
var makeKagglePredictions = require('./makeKagglePredictions.js');
var EventEmitter = require('events');

nn.referencesToChildren = [];
var dataSummary; 
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



module.exports = {
  killAll: function() {
    for(var i = 0; i < nn.referencesToChildren.length; i++) {
      nn.referencesToChildren[i].kill();
    }
  },
  startTraining: function() {
    console.log('dataFile:',argv.dataFile);

    readAndFormatData(function() {
      // nn.dataSummary just got set by readAndFormatData, asynchronously;
      parallelNets();
    });

  }

};



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


var updateNetStatus = function(message) {
  var id = message.brainID;
  nn.neuralNetResults[id].iterations = message.iterations;
  nn.neuralNetResults[id].trainingErrorRate.push(message.errorRate);
  nn.neuralNetResults[id].net = message.net;
}

var createChild = function() {
  var child_process = require('child_process'); //this is node's built in module for creating new processes. 
  // TODO: this might be the only place we need to make a change between streaming and passing in the whole dataset
  // FUTURE: see if we can increase the max memory size for each child process, as we would with node "--max-old-space-size= 4000" to signify a ~4GB RAM limit. 
    // NOTE: different computers handle that command as either bytes or megabytes. be careful. 
  if(argv.useStreams) {
    var child = child_process.fork('./brainChildStream',{cwd: nn.location});
  } else {
    var child = child_process.fork('./brainChildMemoryHog',{cwd: nn.location});
  }

  var messageObj = trainingUtils.makeTrainingObj( allParamsToTest.shift() );

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

  if(nn.neuralNetResults[messageObj.brainID] === undefined) {
    nn.neuralNetResults[messageObj.brainID] = netTrackingObj;
  } else {
    console.log('we already have a net at this property:',messageObj.brainID);
    console.log('other brain info:',messageObj);
  }

  return child;
}


function attachListeners(child) {
  child.running = true;
  child.startTime = Date.now();
  child.on('message', function(message) {
    var id = message.brainID;
    if(message.type === 'finishedTraining') {
      updateNetStatus(message);
      nn.neuralNetResults[id].running = false;
      child.running = false;
      child.endTime = Date.now();
      nn.completedNets++;
      // Or maybe we don't have to kill it, we can just send it new information to train on?!
      child.kill();
      //TODO: send over a better message to bestNetChecker. 
      bestNetChecker(message); 

      // var net = new brain.NeuralNetwork();
      // testOutput(net.fromJSON(message.net));
      // TODO: have some way of timeboxing each experiment??

      console.log('trained', nn.completedNets,'so far,', nn.numOfNetsToTest - nn.completedNets, "still learning everything it can about your dataset in it's quest to be your best neural net ever!");

      if(allParamsToTest.length > 0) {
        var newChild = createChild();
        attachListeners(newChild);
        nn.referencesToChildren.push(newChild);
      } else if (nn.completedNets === nn.numOfNetsToTest) {
        console.log('done training all the neural nets you could conjure up!');
        // this is a flag to warn the user that we're still training some nets if they try to access the results before we're finished
        nn.readyToMakePredictions = true;
        // TODO TODO: load up the bestNet
          // train it for a longer period of time (10 minutes by default, but let the user specify this eventually)
          // once we have reached that threshold, only then run makeKagglePredictions
        // var extendedTrainingNet = new brain.NeuralNetwork();
        // extendedTrainingNet.fromJSON(nn.bestNetObj.trainingBestAsJSON);


        if(argv.kagglePredict || argv.devKaggle) {
          makeKagglePredictions( argv.kagglePredict, argv.ppCompleteLocation );
        }
      } 
      
    } else if (message.type === 'midTrainingCheckIn'){
      // TODO: build in logic to make this time based as well as iteration based. 
      updateNetStatus(message);
      bestNetChecker(message);
    } else {
      console.log('heard a message in parent and did not know what to do with it:',message);
    }
  });
}


// we will set a global value for this when we call parallelNets for the first time
var allParamsToTest; 

var parallelNets = function() {
  // Nets we want to test:
  // 1. hidden layers: 1 - 10
    // most likely, we'll settle on something like 1-3 hidden layers, but it's fun to try them all
  // 2. nodes per hidden layer: (0.5 - 100) * numFeatures
  allParamsToTest = trainingUtils.createParamsToTest();
  nn.numOfNetsToTest = allParamsToTest.length;

  // create a new child_process for all but one of the cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {
    // wrapping this in an IIFE so each child is available in it's own scope
    // if we still have something left to test, create a new child!
    if(allParamsToTest.length) {
      (function() {
        var child = createChild();
        attachListeners(child);
        nn.referencesToChildren.push(child);
      })();
      
    }
  }

};

// FUTURE: stop training once the deltas between iterations have decreased to be only x% of what they were for the first three iterations. 
  // say the error for the first three iterations decreases from .065 to .055, that would be a delta of -.010. That means an average delta of roughly -.003 for each of those iterations.
  // as soon as we reach a point where each training iteration is only giving us a delta of, say, one tenth of that, or -.0003, we stop the training, basically saying it's inefficient. 
  // The great part about this is that it's all relative. So we wouldn't hold a net with a training rate of .3 to the same absolute standard as a net with a trainingRate of .9. 

// CLEAN: I don't think we need any of the following code anymore, now that we're just sending in maxChildTrainingTime and maxChildTrainingIterations as parameters to the child process. 


var mostRecentWrittenNet = Date.now();
var namesOfWrittenNets = [];
var bestNetChecker = function(trainingResults) {
  // console.log('checking if this is the best net:',trainingResults);
  // nn.bestNetObj.trainingErrorRate is an array of all the error rates it has had along the way. We want the most recent one. 
  if(trainingResults.errorRate < nn.bestNetObj.trainingErrorRate[nn.bestNetObj.trainingErrorRate.length -1]) {
    // console.log('trainingResults:',trainingResults);
    // console.log('trainingResults.net:',trainingResults.net);
    // make this the best net
    nn.bestNetObj.trainingBestAsJSON = JSON.stringify(trainingResults.net);
    // we will have many new bestNets on our first training round. This prevents us from having too many new files created
    // Admittedly, this is potentially still creating a new net every three seconds, which is a lot.
    // The risk we're running right now is simply that we lose three seconds worth of work. The worst case scenario is that we write the most recent net to file, and then 2.9 seconds later, we simultaneously get a new best net, don't write it to file, and then close out the server for some reason, forever losing that last net. This seems a small risk. 
    if(nn.completedNets > 0 || Date.now() - mostRecentWrittenNet > 3000 || trainingResults.type === 'finishedTraining') {
      var bestNetFileName = 'neuralNet/bestNet/bestNet' + Date.now() + '.txt';
      namesOfWrittenNets.push(bestNetFileName);
      fs.writeFile(bestNetFileName, nn.bestNetObj.trainingBestAsJSON, function() {
        // delete the previously written bestNet file(s), now that we have a new one written to disk successfully. 
        while(namesOfWrittenNets.length > 1) {
          fs.unlink(namesOfWrittenNets.shift());
        }
      });
      mostRecentWrittenNet = Date.now();
    }
    // TODO: grab the entire array
    nn.bestNetObj.trainingErrorRate = nn.neuralNetResults[trainingResults.brainID].trainingErrorRate;
    nn.bestNetObj.trainingBestTrainingTime = trainingResults.trainingTime;
    nn.bestNetObj.iterations = trainingResults.iterations;
  }
};
