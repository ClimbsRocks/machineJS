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
        for(var key in message.text) {
          module.exports.fileNames[key] = message.text[key];
          
        }
      }
    });
  },

  formatInitialData: function( callback) {
    console.log('formatting the training data set');
    module.exports.formatData( callback, 'train');
  },

  kickOffTraining: function( callback, classifierName) {
    // console.log('fileNames:',module.exports.fileNames);
    var pythonOptions = utils.generatePythonOptions(argv.dataFile, [JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName]);


    var pyShell = utils.startPythonShell('training.py', callback, pythonOptions);
    pyShell.on('message', function(message) {
      if(message.type === 'trainingResults') {
        global.trainedAlgos[classifierName] = message.text;
      }
    });
  },

  makePredictions: function( callback, classifierName) {
    console.log('kicking off the process of making predictions on the predicting data set!');

    var startPredictionsScript = function() {
      var pythonOptions = utils.generatePythonOptions(argv.kagglePredict, [module.exports.dictVectMapping, JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName]);

      utils.startPythonShell('makePredictions.py', callback, pythonOptions);
      console.log('we have started a python shell with makePredictions.py')
    };

    // reads our predict file, formats it, and then invokes startPredictionsScript as it's callback
    // right now we are formatting the file multiple times, where we should only have to format that data once. 
    // TODO: throw in a flag for whether we've already formatted the prediction data or not. obviously, if we have, use it, skip over invoking formatData again, and just invoke startPredictionsScript directly. 
    module.exports.formatData( startPredictionsScript, 'predict')

  }

}
