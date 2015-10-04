var path = require('path');
var utils = require('./utils.js');

module.exports = {

  formatData: function(globals, callback, trainOrPredict) {
    var dataFile = globals.argv.dataFile;
    if(trainOrPredict === 'predict') {
      dataFile = globals.argv.kagglePredict;
    }
    var pythonOptions = utils.generatePythonOptions(dataFile, trainOrPredict);

    utils.startPythonShell('dataFormatting.py', callback, pythonOptions, globals.referencesToChildren);

  },

  formatInitialData: function(globals, callback) {
    console.log('inside formatInitialData');
    module.exports.formatData(globals, callback, 'train');
  },

  kickOffForestTraining: function(globals, callback) {
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile);

    utils.startPythonShell('training.py', callback, pythonOptions, globals.referencesToChildren);
  },

  makePredictions: function(globals, callback, rfPickle) {
    module.exports.formatData(globals, callback, 'predict')

    // TODO TODO: pass in the name of the file we are making predictions on
    var pythonOptions = utils.generatePythonOptions(globals.argv.kagglePredict);

    utils.startPythonShell('makePredictions.py', pythonOptions, callback, globals.referencesToChildren);

  }

}
