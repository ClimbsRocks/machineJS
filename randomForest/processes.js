var path = require('path');
var utils = require('./utils.js');

module.exports = {
  dictVectMapping: {

  },

  formatData: function(globals, callback, trainOrPredict) {
    var dataFile = globals.argv.dataFile;
    if(trainOrPredict === 'predict') {
      dataFile = globals.argv.kagglePredict;
    }
    var pythonOptions = utils.generatePythonOptions(dataFile, trainOrPredict);

    var pyShell = utils.startPythonShell('dataFormatting.py', callback, pythonOptions, globals.referencesToChildren);

    pyShell.on('message', function(message) {
      if(message.type === 'dictVectMapping') {
        module.exports.dictVectMapping = message.text;
      }
    });
  },

  formatInitialData: function(globals, callback) {
    console.log('formatting the training data set');
    module.exports.formatData(globals, callback, 'train');
  },

  kickOffForestTraining: function(globals, callback) {
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile);

    utils.startPythonShell('training.py', callback, pythonOptions, globals.referencesToChildren);
  },

  makePredictions: function(globals, callback, rfPickle) {
    console.log('making predictions on the test data set');
    module.exports.formatData(globals, callback, 'predict')

    // TODO TODO: pass in the name of the file we are making predictions on
    var pythonOptions = utils.generatePythonOptions(globals.argv.kagglePredict);

    utils.startPythonShell('makePredictions.py', pythonOptions, callback, globals.referencesToChildren);

  }

}
