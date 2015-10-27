var py = global.pythonNamespace = {};
var exec = require('child_process').exec;

var path = require('path');
var rfLocation = path.dirname(__filename);
py.rfLocation= rfLocation;
py.referencesToChildren= [];
var processes = require('./processes.js');
var classifierOptions = require('./classifierList.js');

argv = global.argv;


module.exports = {
  killAll: function() {
    // kill all child processes
    for (var i = 0; i < py.referencesToChildren.length; i++) {
      py.referencesToChildren[i].childProcess.kill();
    }

    // this is frequently not killing all the child processes of that child process. so if our python shell is running 8 other python scripts to spread the training out around all the cores, those 8 other python scripts are continuing to run after the above. 
    // the following command will be executed on the command line and will kill all Python processes. 
    // the unfortunate side effect is that any unrelated Python processes running on this machine will also be killed. But since this library takes up all the cores on the machine anyways, the user would likely have a very hard time running other Python scripts simultaneously regardless. 
    exec('pkill -9 Python');
  },

  startTraining: function() {
    argv.numCPUs = argv.numCPUs || -1;
    console.log('in one part of your machine, we will be training a randomForest');

    var startOneClassifier = function(classifierName) {
      // kick off training, and then, once that is done, invoke the callback, which starts the process of making predictions
      processes.kickOffTraining( function() {
        module.exports.makePredictions(classifierName);
      }, classifierName);
    };

    var startAllClassifiers = function() {
      if( argv.dev ) {
        var classifierList = classifierOptions.dev;
      } else if( processes.fileNames.trainingDataLength < 10000 ) {
        var classifierList = classifierOptions.shortDataSet;
      } else {
        var classifierList = classifierOptions.longDataSet;
      }

      for (var classifierName in classifierList) {
        startOneClassifier(classifierName);
      }
    };

    // if this is while we are developing, skip over the data formatting part, as that is already well tested and known. 
    if( argv.dev ) {
      processes.fileNames = require('./testingFileNames');
      startAllClassifiers();
    } else {
      processes.formatData( startAllClassifiers );
    }

  },

  makePredictions: function(classifierName) {

    // var madeNoise = false;
    processes.makePredictions( function() {
      process.emit('algoFinishedTraining');
      // if(!madeNoise) {
      //   console.log('when you came to a fork in the woods, you trained a machine to explore not just all the immediate possibilities down either side, but all the forks that came after that.');
      // }
    }, classifierName);
  }

};
