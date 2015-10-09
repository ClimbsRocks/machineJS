var py = global.pythonNamespace = {};
var exec = require('child_process').exec;

var path = require('path');
var rfLocation = path.dirname(__filename);
py.rfLocation= rfLocation;
py.referencesToChildren= [];
var processes = require('./processes.js');

argv = global.argv;


module.exports = {
  killAll: function() {
    // kill all child processes
    console.log('heard a killAll event in python');
    for (var i = 0; i < py.referencesToChildren.length; i++) {
      console.log('iterating through py.referencesToChildren position:',i);
      // TODO TODO: see how this differs from the childProcesses that are available in controllerNN.js, and figure out how to fill them. This is accessing the childProcess objects, it seems. 
      console.log(Object.keys(py.referencesToChildren[i].childProcess));
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

    processes.formatInitialData( function() {
      var classifierList = require('./classifierList.js');
      for (var classifierName in classifierList) {
        startOneClassifier(classifierName);
        
      }
    });

  },

  makePredictions: function(classifierName) {

    processes.makePredictions( function() {
      process.emit('algoFinishedTraining');
      console.log('when you came to a fork in the woods, you trained a machine to explore not just all the immediate possibilities down either side, but all the forks that came after that.');
      console.log('we have finished training, tuning, and making predictions from a randomForest- typically one of the most predictive algorithms out there.');
      console.log('Thanks for letting us help you find your way through this dataset!');
    }, classifierName);
  }

};
