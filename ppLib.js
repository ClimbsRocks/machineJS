var controllerNN = require('./neuralNet/controllerNN.js');
var controllerRF = require('./randomForest/controller.js');
var controllerEnsemble = require('./ensembling/controller.js');

var path = require('path');
var dataFile = process.argv[2];
// var advancedOptions = process.argv[3] || {};
var argv = require('minimist')(process.argv.slice(1));
argv.computerTotalCPUs = require('os').cpus().length;
argv.ppCompleteLocation = path.dirname(__filename);

console.log('thanks for inviting us along on your machine learning journey!');


// setting defaults if using the --dev or --devKaggle flags (speeds up development time when doing engineering work on the ppComplete library itself)
if(argv.dev || argv.devKaggle || argv.devEnsemble) {
  require('longjohn');
  if (dataFile.slice(-4) !== '.csv') {
    dataFile = 'kaggleGiveCredit.csv'
  }
  if (argv.devKaggle && !argv.kagglePredict || argv.devEnsemble) {
    argv.kagglePredict = 'kaggleGiveCreditTest.csv';
  }
}

argv.dataFile = dataFile;

var readyToMakePredictions = false;

if (argv.devEnsemble) {
  controllerEnsemble.startListeners(2, globalArgs);
  controllerEnsemble.createEnsemble(argv);
} else {
  // **********************************************************************************
  // Here is where we invoke the method with the path to the data
  // we pass in a callback function that will make the dataSummary a global variable 
    // and invoke parallelNets once formatting the data is done. 
  // argv.numCPUs = argv.computerTotalCPUs/2;
  controllerNN.startTraining(argv);
  // **********************************************************************************
  // argv.numCPUs = argv.computerTotalCPUs/2;
  controllerRF.startTraining(argv);
  
  controllerEnsemble.startListeners(2, argv);
}

var ppLibShutdown = function() {
  controllerNN.killAll();
  controllerRF.killAll();
};
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
    console.log('we heard an unexpected shutdown event that is causing everything to close');
    ppLibShutdown();
    throw error;
  }
});

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  //graceful shutdown
  ppLibShutdown();
  process.exit();
});

