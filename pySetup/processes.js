var py = global.pythonNamespace;
var argv = global.argv;
var path = require('path');
var utils = require('./utils.js');

module.exports = {
  dictVectMapping: {
    // this will be given to us by DictVectorizer when it's run by python
  },

  formatData: function( callback, trainOrPredict) {
    var dataFile = argv.dataFile;
    if(trainOrPredict === 'predict') {
      dataFile = argv.kagglePredict;
    }
    var pythonOptions = utils.generatePythonOptions(dataFile, [trainOrPredict, JSON.stringify(argv)]);

    var pyShell = utils.startPythonShell('dataFormatting.py', callback, pythonOptions);

    pyShell.on('message', function(message) {
      if(message.type === 'dictVectMapping') {
        module.exports.dictVectMapping = message.text;
      }
    });
  },

  formatInitialData: function( callback) {
    console.log('formatting the training data set');
    module.exports.formatData( callback, 'train');
  },

  kickOffForestTraining: function( callback) {
    var pythonOptions = utils.generatePythonOptions(argv.dataFile, JSON.stringify(argv));

    utils.startPythonShell('training.py', callback, pythonOptions);
  },

  makePredictions: function( callback, rfPickle) {
    console.log('kicking off the process of making predictions on the predicting data set!');

    var startPredictionsScript = function() {
      var pythonOptions = utils.generatePythonOptions(argv.kagglePredict, [module.exports.dictVectMapping, JSON.stringify(argv)]);

      utils.startPythonShell('makePredictions.py', callback, pythonOptions);
      console.log('we have started a python shell with makePredictions.py')
    };

    module.exports.formatData( startPredictionsScript, 'predict')

  }

}
