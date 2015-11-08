var py = global.pythonNamespace;
var argv = global.argv;
var path = require('path');
var utilsPyShell = require('./utilsPyShell.js');
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
    // X_train_nn- used by neural networks. we will use the same ID and y_train files as the rest of the dataset. It is only the input features that have to be normalized, not the output features. 
    // X_test_nn- used by neural networks. we will use the same ID and y_train files as the rest of the dataset. It is only the input features that have to be normalized, not the output features. 
    // trainingDataLength- technically not a file name, but fits much more logically here than reading in that file again in node.js
    // problemType: 'regression' or 'category'
  },

  splitData: function(callback) {
    var dfArgs = {
      fileNames: module.exports.fileNames,
      searchPercent: argv.searchPercent,
      validationPercent: argv.validationPercent,
    };

    // generatePythonOptions assumes the first input is the name of a data file that training.py or makePredictions.py will be run on. Pass in ignoreMe.csv for now until we refactor that. 
    var pythonOptions = utilsPyShell.generatePythonOptions('ignoreMe.csv', [JSON.stringify(argv), JSON.stringify(module.exports.fileNames) 
      ] );
    
    var pyShell = utilsPyShell.startPythonShell('splitDatasets.py', callback, pythonOptions);

  },

  formatData: function( callback ) {
    // the callback function will be invoked with an object that holds the fileNames needed by module.exports.fileNames
    var dataFormatterArgs = {
      trainingData: argv.dataFile,
      testingData: argv.kagglePredict,
      trainingPrettyName: argv.outputFileName,
      testingPrettyName: argv.testOutputFileName,
      joinFileName: argv.join,
      on: argv.on
    };

    df(dataFormatterArgs, function(fileNames) {
      console.log(fileNames);
      // df takes in a callback function that will be invoked with the fileNames object, holding the names and locations of the files it saved the data into
      module.exports.fileNames = fileNames;
      callback();
    });

  },

  kickOffTraining: function( callback, classifierName) {
    var pythonOptions = utilsPyShell.generatePythonOptions(argv.dataFile, [JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName, module.exports.fileNames.problemType]);

    var emitFinishedTrainingCallback = function() {
      process.emit('algoFinishedTraining');
      callback();
    }


    var pyShell = utilsPyShell.startPythonShell('training.py', emitFinishedTrainingCallback, pythonOptions);
    // pyShell.on('message', function(message) {
    //   if(message.type === 'trainingResults') {
    //     process.emit('algoFinishedTraining');
    //     global.trainedAlgos[classifierName] = message.text;
    //   }
    // });
  },

  makePredictions: function( callback, classifierName) {
    console.log('kicking off the process of making predictions on the predicting data set for:', classifierName);

    // TODO: 
    var startPredictionsScript = function() {
      var pythonOptions = utilsPyShell.generatePythonOptions(argv.kagglePredict, [module.exports.dictVectMapping, JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName, module.exports.fileNames.problemType]);

      utilsPyShell.startPythonShell('makePredictions.py', callback, pythonOptions);
    };

    startPredictionsScript();


    // TODO: we will already have the data formatted for us by data-formatter, so we can probably skip right to invoking startPredictionsScript. 

    // reads our predict file, formats it, and then invokes startPredictionsScript as it's callback
    // right now we are formatting the file multiple times, where we should only have to format that data once. 
    // former todo: throw in a flag for whether we've already formatted the prediction data or not. obviously, if we have, use it, skip over invoking formatData again, and just invoke startPredictionsScript directly. 
    // module.exports.formatData( startPredictionsScript, 'predict')

  }

}
