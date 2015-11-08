global.argv = require('minimist')(process.argv.slice(1));
var path = require('path');
global.rootDir = path.dirname(__filename);

var controllerPython = require('./pySetup/controllerPython.js');
var processShutdownListeners = require('./processShutdownListeners.js');
var processArgs = require('./processArgs.js');

var ensembler = require('ensembler');

console.log('thanks for inviting us along on your machine learning journey!\n');


processArgs();

if (argv.devEnsemble) {
  // ensembler.startListeners(numberOfClassifiers, argv.dataFilePretty, './predictions', argv.ppCompleteLocation );
  ensembler.createEnsemble( argv.dataFilePretty, './predictions', argv.ppCompleteLocation );
} else {

  // console.log('argv in ppLib.js:', argv);
  controllerPython.startTraining(argv);
  
}

processShutdownListeners(controllerPython);

