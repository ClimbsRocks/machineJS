var fs = require('fs');
var brain = require('brain');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var kpCompleteLocation = path.dirname(__filename);
var readAndFormatData = require(path.join(kpCompleteLocation,'readAndFormatData.js'));
var dataFile = process.argv[2];
// var advancedOptions = process.argv[3] || {};
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);

console.log('numCPUs:',numCPUs);

var bestNetObj = {
  trainingBestAsJSON: '',
  testingBestAsJSON: '',
  trainingError: 1,
  testingError: 1,
  trainingBestTrainingTime: Infinity,
  testingBestTrainingTime: Infinity
};

var globalTrainingData = [];

var dataSummary; // this will eventually be set equal to what readAndFormatData gives us.
var readyToMakePredictions = false;

module.exports = {

  // I have not revisited this in a while and it likely doesn't work anymore. 
  // train: function(trainingData) {
  //   // open a writeStream
  //   var writeStream = fs.createWriteStream('inputData.txt',{encoding: 'utf8'});

  //   // This writes larger chunks of data to the writeStream at a time, which signgificantly improved performance over writing each line and each newline character individually.
  //   // We are open to pull requests if anyone wants to optimize this further. 
  //   for(var i = 0; i < trainingData.length; i+=10) {
  //     var writeString = '';
  //     for(var j = 0; j < 10; j++) {
  //       if(i + j < trainingData.length) {
  //         writeString += JSON.stringify(trainingData[i + j]) + '\n';
  //         // TODO: give the user the option of keeping the data in memory. Since this is passed around by reference, we're actually overwriting the original data. This is low priority. 
  //         // set all data equal to null to free up space in RAM. 
  //         trainingData[i + j] = null;          
  //       }
  //     }
  //     writeStream.write(writeString);
  //     writeString = '';
  //   }

  //   writeStream.on('drain', function() {
  //     writeStream.end();
  //   });

  //   writeStream.on('finish', function() {

  //     console.log('finished writing the data to a file');
  //     trainingData = null; //make sure to no longer point any variables to our trainingData, in case any still exists. 

  //     multipleNetAlgo();

  //   });
  // },

  makePrediction: function(inputRow) {
    // TODO: format the inputRow the exact same way we formatted our training data
    if(!readyToMakePredictions) {
      console.log('The nets are still training. Do you wish to make a prediction with the best net we have so far?');
      // ADVANCED: let them make predictions while the net is still training. 
    } else {
      console.log('we would run the prediction here');
      // format the data
      // run it through our bestNet
      // eventually, run it through our ensemble
      // return predicted value
    }
  }

};

var createEnsemble = function() {
  // before anything else: make sure that our output has the exact same name for everything. 
  // 1. average all predicted results together
  // 2. take highest value
  // 3. take lowest value
  // 4. take highest or lowest based on which is closer to 100 or 0 (given 63 and 12, we would take 12 because it's relative absolute value (totally made up term) is greatest).
  // 5. only take highest or lowest if they are above/below a certain threshold AND if they are 20 percentage points different than the other prediction. 
  // 6. weight the predictions based on some metrics
    // if two agree, take that value more heavily
    // if one is super high or super low, weight that one more
    // 
}

var totalRunningNets = 0;
var neuralNetResults = {};

var allParamsToTest = [];
// we will invoke this when we call parallelNets for the first time
function createParamsToTest(maxLayers, maxNodesMultiplier) {
  // TODO: only have 1,2,3,6,and 10 hidden layers. not 1-10 continuous as we have now.
  // TODO: have 1,2,5,10,50,100 times the number of features as the nodes for each hidden layer
  // TODO: figure out some way of having fewer than 1 times the number of features as the node for each hidden layer. 
    // e.g., DilMil where we pruned out any feature that wasn't present in at least 1% of the dataset. 
      // technically, I grouped all those features together into something like "column5RareFeature = 1"

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
    for (var j = 1; j <= maxNodesMultiplier; j++) {
      allParamsToTest.push(createOneParamArray(i,j));
    }
  }
  numOfNetsToTest = allParamsToTest.length;
}

var updateNetStatus = function(message) {
  // console.log('message inside updateNetStatus',message);
  var id = message.brainID;
  neuralNetResults[id].iterations = message.iterations;
  neuralNetResults[id].trainingErrorRate = message.errorRate;
  neuralNetResults[id].net = message.net;
}

var createChild = function() {
  var child_process = require('child_process'); //this is node's built in module for creating new processes. 
  // TODO: this might be the only place we need to make a change between streaming and passing in the whole dataset
  // FUTURE: see if we can increase the max memory size for each child process, as we would with node "--max-old-space-size= 4000" to signify a ~4GB RAM limit. 
    // NOTE: different computers handle that command as either bytes or megabytes. be careful. 
  if(argv.useStreams) {
    var child = child_process.fork('./brainChildStream',{cwd: kpCompleteLocation});
  } else {
    var child = child_process.fork('./brainChildMemoryHog',{cwd: kpCompleteLocation});
  }
  var messageObj = makeTrainingObj( allParamsToTest.shift() );

  child.send(messageObj);

  var netTrackingObj = {
    hiddenLayers: messageObj.hiddenLayers,
    learningRate: messageObj.trainingObj.learningRate,
    iterations: 0,
    trainingErrorRate: Infinity,
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
        console.log('trained', totalRunningNets - numCPUs ,'so far,', allParamsToTest.length, 'to go');
        var newChild = createChild();
        attachListeners(newChild);
        referencesToChildren.push(newChild);
      } else if (completedNets === numOfNetsToTest) {
        console.log('done training all the neural nets you could conjure up!');
        // this is a flag to warn the user that we're still training some nets if they try to access the results before we're finished
        readyToMakePredictions = true;
        console.log(neuralNetResults);
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
    } else {
      console.log('heard a message in parent and did not know what to do with it:',message);
    }
  });
}

var referencesToChildren = [];

var parallelNets = function() {
  // Nets we want to test:
  // 1. hidden layers: 1 - 10
    // most likely, we'll settle on something like 1-3 hidden layers, but it's fun to try them all
  // 2. nodes per hidden layer: (0.5 - 100) * numFeatures
  createParamsToTest(10,10);


  // create a new child_process for all but one of the cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {
    // wrapping this in an IIFE so each child is available in it's own scope
    (function() {
      var child = createChild();
      attachListeners(child);
      referencesToChildren.push(child);
    })();
  }

};

var maxChildTrainingTime = argv.maxTrainingTime || 5 * 60; // limiting each child to only be trained for 5 minutes by default.
// console.log('advancedOptions:',advancedOptions);
var maxChildTrainingIterations = argv.maxTrainingIterations || 100;
// ADVANCED: let them specify a total training time, and then we'll guesstimate how long each child has to train from there

var trainingCuller = function() {
  // console.log('referencesToChildren:', referencesToChildren);
  for (var i = 0; i < referencesToChildren.length; i++) {
    var child = referencesToChildren[i];
    if(child.running) {
      var elapsedTrainingTime = (Date.now() - child.startTime) / 1000; // time is in milliseconds. elapsedTrainingTime is now in seconds.
      console.log('maxChildTrainingTime is:',maxChildTrainingTime,'elapsedTrainingTime is:',elapsedTrainingTime);
      if(elapsedTrainingTime > maxChildTrainingTime ) {
        // get the latest data from the child
        // this will send a message to the child. the child will then, as soon as it has time, send off a finishedTraining message back to the parent. This will then be handled up above by the standard event handlers for when we finish training a net. 
        // part of that process involves killing the child process.
        console.log('sent a kill message');
        child.send({
          type: 'killProcess'
        });

        // kill the child
        // follow the same steps as we would when the child finishes training naturally.
      }
    }
  }
};

// ADVANCED: kill off some nets more quickly if we see that they're behind where other nets were after 200 iterations, and the delta between their iterations is smaller than other nets. 

// TODO: run this once every minute, or on some less-frequent basis. 
var killNetChildInterval = setInterval(function() {
  trainingCuller();
}, 1000);

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

  // TODO: turn this into a single error number, rather than the human-readable output below.
  readStream.on('end', function() {
    for(var key in testSummary) {
      console.log(key, 'count:', testSummary[key].countOfPredictionsAtThisProbability, 'rate:', Math.round(testSummary[key].observedValues / testSummary[key].countOfPredictionsAtThisProbability * 100) + '%');
    }
  });
};

var bestNetChecker = function(trainingResults,trainedNet) {
  // console.log('checking if this is the best net:',trainingResults);
  if(trainingResults.error < bestNetObj.trainingErrorRate) {
    // make this the best net
    bestNetObj.trainingBestAsJSON = trainingResults.net;
    fs.writeFile('bestNet' + Date.now(), bestNetObj.trainingBestAsJSON);
    bestNetObj.trainingErrorRate = trainingResults.error;
    bestNetObj.trainingBestTrainingTime = trainingResults.trainingTime;
  }
  //check against our global bestNet
  // console.log('bestNet now is:',bestNet);
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
  var pathToChildData = path.join(kpCompleteLocation,fileName);

  var totalMessageObj = {
    type: 'startBrain',
    brainID: brainID,
    hiddenLayers: hlArray, 
    trainingObj: trainingObj, 
    pathToData: pathToChildData, 
    totalRows: totalRows
  };

  return totalMessageObj;
}

// var multipleNetAlgo = function() {
//   // TODO: 
//     // nest everything inside a recursive function
//     // that function will recurse until we've covered the entire space and converged on an answer
//     // each iteration will create a new set of params we want to test against
//     // we will then invoke parallelNets, which will take in an array of params we want to try, and return a promise. 
//     // once we get the promise back, we'll invoke the recursive function again
//     // that recursive function will then perform some logic, find a new set of params to train against, and then invoke parallelNets...
//     // Yeah, Katrina for sure gets the challenging part. 
//     // That'll be a ton of fun for her :)

//   //create logic for training as many nets as we need. 
//   var allParamComboArr = [];
//   for(var i = numCPUs; i > 0; i--) {

//     var hlArray = [];
//     for (var j = 0; j < i; j++) {
//       hlArray.push(10);
//     }

//     var trainingObj = {
//       errorThresh: 0.053,  // error threshold to reach
//       iterations: 1000,   // maximum training iterations
//       log: true,           // console.log() progress periodically
//       logPeriod: 1,       // number of iterations between logging
//       learningRate: 0.6    // learning rate
//     };

//     var fileName = '/formattedData' + (i - 1) + '.txt';
//     var pathToData = path.join(kpCompleteLocation,fileName);

//     allParamComboArr.push({hiddenLayers: hlArray, trainingObj: trainingObj, pathToData: pathToData, totalRows: totalRows});
//   }

//   parallelNets(allParamComboArr);
// };

// Here is where we invoke the method with the path to the data
// we pass in a callback function that will make the dataSummary a global variable 
  // and invoke parallelNets once formatting the data is done. 
console.log('pathToData before invoking readAndFormatData:')
readAndFormatData(kpCompleteLocation, dataFile, function(formattingSummary) {
  dataSummary = formattingSummary;
  parallelNets();
});

