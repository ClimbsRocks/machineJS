var path = require('path');
global.argv = require('minimist')(process.argv.slice(1));
var path = require('path');
global.rootDir = path.dirname(__filename);

if(argv.dev || argv.devKaggle) {
  argv.dev = true;
} else {
  argv.dev = false;
}

var controllerPython = require('./pySetup/controllerPython.js');
processShutdownListeners = require('./processShutdownListeners.js');

var ensembler = require('ensembler');
var dataFile = process.argv[2];
argv.computerTotalCPUs = require('os').cpus().length;
argv.ppCompleteLocation = path.dirname(__filename);

console.log('thanks for inviting us along on your machine learning journey!\n');

// TODO: refactor further so that we set all the default values in another file

// setting defaults if using the --dev or --devKaggle flags (speeds up development time when doing engineering work on the ppComplete library itself)
if( argv.dev ) {
  require('longjohn');
  if (dataFile.slice(-4) !== '.csv') {
    dataFile = 'data/titanic/train.csv'
  }
  if ( (argv.devKaggle && !argv.kagglePredict) || argv.devEnsemble) {
    argv.kagglePredict = 'data/titanic/test.csv';
  }
}

argv.dataFile = dataFile;
argv.dataFileName = path.basename( argv.dataFile );
argv.dataFilePretty = argv.dataFileName.slice(0,-4);
argv.binaryOutput = argv.binaryOutput || false; //python doesn't like undefined, so explicitly set this to false if it does not exist
argv.outputFileName = argv.dataFilePretty;
if( argv.dataFileName === 'train' ) {
  dataFileFolder = path.parse(argv.dataFile).dir.split(path.sep).pop();
  argv.outputFileName = dataFileFolder + argv.dataFilePretty;
}

argv.testFileName = path.basename( argv.kagglePredict );
argv.testFilePretty = argv.testFileName.slice(0,-4);
argv.testOutputFileName = argv.testFilePretty;

if( argv.dataFileName === 'test' ) {
  dataFileFolder = path.parse(argv.testFileName).dir.split(path.sep).pop();
  argv.testOutputFileName = dataFileFolder + argv.testFilePretty;
}
console.log('argv.outputFileName');
console.log(argv.outputFileName);

var readyToMakePredictions = false;
var numberOfClassifiers = require('./pySetup/classifierList');
numberOfClassifiers = Object.keys(numberOfClassifiers).length;


if (argv.devEnsemble) {
  ensembler.startListeners(numberOfClassifiers, argv.dataFilePretty, './predictions', argv.ppCompleteLocation );
  ensembler.createEnsemble( argv.dataFilePretty, './predictions', argv.ppCompleteLocation );
} else {
  // **********************************************************************************
  // Here is where we invoke the method with the path to the data
  // we pass in a callback function that will make the dataSummary a global variable 
    // and invoke parallelNets once formatting the data is done. 
  // **********************************************************************************
  controllerPython.startTraining(argv);
  
  ensembler.startListeners( numberOfClassifiers, argv.dataFilePretty, './predictions', argv.ppCompleteLocation );
}

processShutdownListeners(controllerPython);

