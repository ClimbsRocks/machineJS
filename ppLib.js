#!/usr/bin/env node

(function() {

  var path = require('path');
  global.rootDir = path.dirname(__filename);
  global.argv = {};

  var controllerPython = require('./pySetup/controllerPython.js');
  var shutDown = require('./shutDown.js');
  var processArgs = require('./processArgs.js');

  var ensembler = require('ensembler');

  console.log('thanks for inviting us along on your machine learning journey!\n');

  module.exports = function(argsObj) {
    if(argsObj !== undefined) {
      for(var key in argsObj) {
        global.argv[key] = argsObj[key];
      }
    }

    if( global.argv.validationRound ) {
      console.log('global.argv before processArgs in machineJS validationRound');
      console.log(global.argv);
    }

    console.log('argv.validationRound when deciding whether to invoke processArgs or not', argv.validationRound);
    if( argv.validationRound !== true ) {
      processArgs();
    }

    if (argv.devEnsemble) {
      ensembler.createEnsemble( argv.ensemblerArgs );
    } else if( argv.makePredictions ) {
      controllerPython.makeAllPredictions( argv.makePredictions );
    } else {
      controllerPython.startTraining(argv);  
    }

    shutDown(controllerPython);
  
  };

  // allow the module to be invoked from the command line
  // since this is all wrapped in an IIFE, this if statement will execute and check if machineJS was invoked from another module, or without a parent (from the command line)
  if( !module.parent ) {
    var userArgs = require('minimist')(process.argv.slice(1));
    for( var key in userArgs ) {
      global.argv[key] = userArgs[key];
    }

    module.exports();
  }

})();
