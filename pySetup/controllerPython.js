var py = global.pythonNamespace = {};

var path = require('path');
var rfLocation = path.dirname(__filename);
var processes = require('./processes.js');

var dataFileLocation = rfLocation.split('/');
dataFileLocation.pop();
dataFileLocation = dataFileLocation.join('/');

argv = global.argv;

py.referencesToChildren= [];
py.rfLocation= rfLocation;
py.dataFileLocation= dataFileLocation;
py.rfLocation = rfLocation;


module.exports = {
  killAll: function() {
    // TODO: kill all child processes
    for (var i = 0; i < py.referencesToChildren.length; i++) {
      py.referencesToChildren[i].childProcess.kill();
    }
  },
  startTraining: function() {
    argv.numCPUs = argv.numCPUs || -1;
    console.log('in one part of your machine, we will be training a randomForest');

    // if(argv.dev || argv.devKaggle) {
    //   module.exports.makePredictions();

    // } else {

      processes.formatInitialData( function() {
        processes.kickOffForestTraining( function() {
          // TODO: add in next step in chain here
          module.exports.makePredictions();
        });
      });

    // }
  },
  makePredictions: function(rfPickle) {
    rfPickle = rfPickle || py.rfLocation + '/' + 'bestRF.p';
    processes.makePredictions( function() {
      process.emit('algoFinishedTraining');
      console.log('when you came to a fork in the woods, you trained a machine to explore not just all the immediate possibilities down either side, but all the forks that came after that.');
      console.log('we have finished training, tuning, and making predictions from a randomForest- typically one of the most predictive algorithms out there.');
      console.log('Thanks for letting us help you find your way through this dataset!');
    }, rfPickle);
  }

};
