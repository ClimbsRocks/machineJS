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
    console.log('heard start training for random forests');

    // if(argv.dev || argv.devKaggle) {
    //   utils.kickOffForestTraining(globals,function() {
    //     // TODO: add in next step in chain here
    //     module.exports.makePredictions();
    //   });
    //   // module.exports.makePredictions();

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
      console.log('inside callback after makePredictions() ')
    }, rfPickle);
  }

};
