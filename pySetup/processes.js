var py = global.pythonNamespace;
var argv = global.argv;
var path = require('path');
var utils = require('./utils.js');
var df = require('data-formatter');

module.exports = {
  dictVectMapping: {
    // this will be given to us by DictVectorizer, a python module that takes dictionaries and turns them into arrays. Obviously since dictionaries are not ordered, we need to keep track of which fields end up in which indices. 
  },

  fileNames: {
    // this will be given to us by dataFormatting.py once it has created the files with the formatted data.
    // ID
    // X_train
    // y_train
    // X_test
    // y_test
    // X_train_normalized- used by neural networks. we will use the same ID and y_train files as the rest of the dataset. It is only the input features that have to be normalized, not the output features. 
    // X_test_normalized- used by neural networks. we will use the same ID and y_train files as the rest of the dataset. It is only the input features that have to be normalized, not the output features. 
  },

  formatData: function( callback ) {
    // the callback function will be invoked with an object that holds the fileNames needed by module.exports.fileNames
    df({
      trainingData: argv.dataFile,
      testingData: argv.kagglePredict
    }, function(fileNames) {
      // df takes in a callback function that will be invoked with the fileNames object, holding the names and locations of the files it saved the data into
      module.exports.fileNames = fileNames;
      callback();
    });

  },

  kickOffTraining: function( callback, classifierName) {
    // console.log('fileNames:',module.exports.fileNames);
    // TODO: investigage if we have to refactor how we pass in file names?
    var pythonOptions = utils.generatePythonOptions(argv.dataFile, [JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName]);


    var pyShell = utils.startPythonShell('training.py', callback, pythonOptions);
    pyShell.on('message', function(message) {
      if(message.type === 'trainingResults') {
        global.trainedAlgos[classifierName] = message.text;
      }
    });
  },

  makePredictions: function( callback, classifierName) {
    console.log('kicking off the process of making predictions on the predicting data set for:', classifierName);

    // TODO: 
    var startPredictionsScript = function() {
      var pythonOptions = utils.generatePythonOptions(argv.kagglePredict, [module.exports.dictVectMapping, JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName]);

      utils.startPythonShell('makePredictions.py', callback, pythonOptions);
    };

    startPredictionsScript();


    // TODO: we will already have the data formatted for us by data-formatter, so we can probably skip right to invoking startPredictionsScript. 

    // reads our predict file, formats it, and then invokes startPredictionsScript as it's callback
    // right now we are formatting the file multiple times, where we should only have to format that data once. 
    // former todo: throw in a flag for whether we've already formatted the prediction data or not. obviously, if we have, use it, skip over invoking formatData again, and just invoke startPredictionsScript directly. 
    // module.exports.formatData( startPredictionsScript, 'predict')

  }

}
