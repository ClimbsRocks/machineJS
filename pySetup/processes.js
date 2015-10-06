var py = global.pythonNamespace;
var argv = global.argv;
var path = require('path');
var utils = require('./utils.js');

module.exports = {
  dictVectMapping: {
    // this will be given to us by DictVectorizer, a python module that takes dictionaries and turns them into arrays. Obviously since dictionaries are not ordered, we need to keep track of which fields end up in which indices. 
  },
  fileNames: {
    // this will be given to us by dataFormatting.py once it has created the files with the formatted data.
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

    pyShell.on('message', function(message) {
      if(message.type === 'fileNames') {
        // console.log('fileNames message:',message);
        module.exports.fileNames = message.text;
      }
    });
  },

  formatInitialData: function( callback) {
    console.log('formatting the training data set');
    module.exports.formatData( callback, 'train');
  },

  kickOffForestTraining: function( callback) {
    // console.log('fileNames:',module.exports.fileNames);
    var pythonOptions = utils.generatePythonOptions(argv.dataFile, [JSON.stringify(argv), JSON.stringify(module.exports.fileNames)]);


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
