var path = require('path');
var utils = require('./utils.js');

module.exports = {
  dictVectMapping: {
    // this will be given to us by DictVectorizer when it's run by python
  },

  formatData: function(globals, callback, trainOrPredict) {
    var dataFile = globals.argv.dataFile;
    if(trainOrPredict === 'predict') {
      dataFile = globals.argv.kagglePredict;
    }
    var pythonOptions = utils.generatePythonOptions(dataFile, [trainOrPredict, globals.argv]);

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
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile, globals.argv);

    utils.startPythonShell('training.py', callback, pythonOptions, globals.referencesToChildren);
  },

  makePredictions: function(globals, callback, rfPickle) {
    console.log('kicking off the process of making predictions on the predicting data set!');

    var startPredictionsScript = function() {
      var pythonOptions = utils.generatePythonOptions(globals.argv.kagglePredict, [module.exports.dictVectMapping, globals.argv]);

      utils.startPythonShell('makePredictions.py', callback, pythonOptions, globals.referencesToChildren);
      console.log('we have started a python shell with makePredictions.py')
    };

    module.exports.formatData(globals, startPredictionsScript, 'predict')

  }

}
