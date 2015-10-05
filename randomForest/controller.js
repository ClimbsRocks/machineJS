var path = require('path');
var rfLocation = path.dirname(__filename);
var utils = require('./processes.js');

var dataFileLocation = rfLocation.split('/');
dataFileLocation.pop();
dataFileLocation = dataFileLocation.join('/');

var globals = {
  referencesToChildren: [],
  rfLocation: rfLocation,
  dataFileLocation: dataFileLocation
}


module.exports = {
  killAll: function() {
    // TODO: kill all child processes
    for (var i = 0; i < globals.referencesToChildren.length; i++) {
      globals.referencesToChildren[i].childProcess.kill();
    }
  },
  startTraining: function(argv) {
    globals.argv = argv;
    argv.numCPUs = argv.numCPUs || -1;
    console.log('in one part of your machine, we will be training a randomForest');

    // if(argv.dev || argv.devKaggle) {
    //   module.exports.makePredictions();

    // } else {

      utils.formatInitialData(globals, function() {
        utils.kickOffForestTraining(globals,function() {
          // TODO: add in next step in chain here
          module.exports.makePredictions();
        });
      });

    // }
  },
  makePredictions: function(rfPickle) {
    rfPickle = rfPickle || globals.rfLocation + '/' + 'bestRF.p';
    utils.makePredictions(globals, function() {
      process.emit('algoFinishedTraining');
      console.log('when you came to a fork in the woods, you trained a machine to explore not just all the immediate possibilities down either side, but all the forks that came after that.');
      console.log('we have finished training, tuning, and making predictions from a randomForest- typically one of the most predictive algorithms out there.');
      console.log('Thanks for letting us help you find your way through this dataset!');
    }, rfPickle);
  }

};
