var nn = global.neuralNetwork;
var fs = require('fs');
var brain = require('brain');
var path = require('path');
var EventEmitter = require('events');

nn.location = path.dirname(__filename);
var numCPUs  = require('os').cpus().length;
var argv = global.argv;

var makeKagglePredictions = require('./makeKagglePredictions.js');
var utils = require('./utils.js');
var childUtils = require('./childUtils.js');
var formattingUtils = require('./formattingUtils.js');
var readAndFormatData = require('./dataFormatting/readAndFormatData.js');


module.exports = {
  killAll: function() {
    for(var i = 0; i < nn.referencesToChildren.length; i++) {
      nn.referencesToChildren[i].kill();
    }
  },
  startTraining: function() {
    utils.setGlobalVars();

    readAndFormatData(function() {
      // nn.dataSummary just got set by readAndFormatData, asynchronously;
      parallelNets();
    });

  }

};

// we will set a global value for this when we call parallelNets for the first time
// var allParamsToTest; 

var parallelNets = function() {
  // Nets we want to test:
  // 1. hidden layers: 1 - 10
    // most likely, we'll settle on something like 1-3 hidden layers, but it's fun to try them all
  // 2. nodes per hidden layer: (0.5 - 100) * numFeatures
  childUtils.allParamsToTest = utils.createParamsToTest();
  nn.numOfNetsToTest = childUtils.allParamsToTest.length;

  // create a new child_process for all but one of the cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {
    
    // wrapping this in an IIFE so each child is available in it's own scope
    // if we still have something left to test, create a new child!
    if(childUtils.allParamsToTest.length) {
      (function() {
        var child = childUtils.createChild();
        childUtils.attachListeners(child);
        nn.referencesToChildren.push(child);
      })();
    }

  }
};

