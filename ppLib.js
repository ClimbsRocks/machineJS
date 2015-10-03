// This file should:
  // get user input
  // kick off the training process (likely it's own module)
    // kick off the start of the process for training NNs and RFs and any other algos out there. 
  // kick off the ensembling (again, likely it's own module)
  // kick off the predicting (again, likely it's own module)
  // manage CPUs. 

var controllerNN = require('./neuralNet/controllerNN.js');
var controllerRF = require('./randomForest/controller.js');
var path = require('path');
var ppCompleteLocation = path.dirname(__filename);
var numCPUs  = require('os').cpus().length;
var dataFile = process.argv[2];
// var advancedOptions = process.argv[3] || {};
var argv = require('minimist')(process.argv.slice(2));
var PythonShell = require('python-shell');

console.log('thanks for inviting us along on your machine learning journey!');


// setting defaults if using the --dev or --devKaggle flags (speeds up development time when doing engineering work on the ppComplete library itself)
if(argv.dev || argv.devKaggle) {
  require('longjohn');
  if (dataFile.slice(-4) !== '.csv') {
    dataFile = 'kaggleGiveCredit.csv'
  }
  if (argv.devKaggle && !argv.kagglePredict) {
    argv.kagglePredict = 'kaggleGiveCreditTest.csv';
  }
}

argv.dataFile = dataFile;

var readyToMakePredictions = false;



// **********************************************************************************
// Here is where we invoke the method with the path to the data
// we pass in a callback function that will make the dataSummary a global variable 
  // and invoke parallelNets once formatting the data is done. 
// controllerNN.startTraining(argv);
// **********************************************************************************
controllerRF.startTraining(argv);

// kills off all the child processes if the parent process faces an uncaught exception and crashes. 
// this prevents you from having zombie child processes running indefinitely.
// lifted directly from: https://www.exratione.com/2013/05/die-child-process-die/
// This is a somewhat ugly approach, but it has the advantage of working
// in conjunction with most of what third parties might choose to do with
// uncaughtException listeners, while preserving whatever the exception is.
process.once("uncaughtException", function (error) {
  // If this was the last of the listeners, then shut down the child and rethrow.
  // Our assumption here is that any other code listening for an uncaught
  // exception is going to do the sensible thing and call process.exit().
  if (process.listeners("uncaughtException").length === 0) {
    controllerNN.killAll();
    controllerRF.killAll();
  }
});

