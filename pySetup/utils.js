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
    // problemType: 'regression' or 'category' or 'multi-category'
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

    if( argv.splitDataTest ) {
      // if this is being run from within our test suite, pass in a blank callback to halt executtion after splitDatasets
      callback = function() {};
    }
    
    var pyShell = utilsPyShell.startPythonShell('splitDatasets.py', callback, pythonOptions);
    pyShell.on('message', function(message) {
      if(message.type === 'splitFileNames') {
        for( var key in message.text) {
          module.exports.fileNames[key] = message.text[key];
        }
        global.argv.fileNames = module.exports.fileNames;
      }
    });

  },

  formatData: function( callback ) {
    // the callback function will be invoked with an object that holds the fileNames needed by module.exports.fileNames

    var dataFormatterArgs = {
      trainingData: argv.dataFile,
      testingData: argv.predict,
      trainingPrettyName: argv.outputFileName,
      testingPrettyName: argv.testOutputFileName,
      joinFileName: argv.join,
      on: argv.on,
      allFeatureCombinations: argv.allFeatureCombinations,
      keepAllFeatures: argv.keepAllFeatures
    };

    if( argv.dfOutputFolder ) {
      dataFormatterArgs.outputFolder = argv.dfOutputFolder;
    }

    df(dataFormatterArgs, function(fileNames) {
      console.log('Here are the fileNames from data-formatter. If you want to skip the data-formatter part next time you want to play with this dataset, copy and paste this object into machineJS/pySetup/testingFileNames.js, following the instructions included in that file.');
      console.log(fileNames);
      // df takes in a callback function that will be invoked with the fileNames object, holding the names and locations of the files it saved the data into
      module.exports.fileNames = fileNames;
      callback();
    });

  },

  kickOffTraining: function( callback, classifierName) {
    var pythonOptions = utilsPyShell.generatePythonOptions(argv.dataFile, [JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName, module.exports.fileNames.problemType, global.bestSearchScore]);

    var emitFinishedTrainingCallback = function() {
      global.finishedAlgos++;
      process.emit('algoFinishedTraining');
      callback();
    };


    var pyShell = utilsPyShell.startPythonShell('training.py', emitFinishedTrainingCallback, pythonOptions);
    pyShell.on('message', function(message) {

      // once we get a message back with the trained results, 
      if(message.type === 'trainingResults') {
        var classifierName = message.classifierName;

        // save it into our allResults array
        global.allTrainingResults.push(message.text);
        global.trainedAlgoCounts[classifierName]++;

        // see if this is the best searchScore we've encountered so far
        if( message.text.searchScore > global.bestSearchScore ) {
          global.bestSearchScore = message.text.searchScore;
        }

        // see if this is the best search result for that algorithm so far
        var prevBestResult = global.trainingResultsSummary[classifierName];
        if( message.text.searchScore > prevBestResult || prevBestResult === undefined ) {
          global.trainingResultsSummary[classifierName] = message.text.searchScore;
        }
        // global.trainedAlgos[classifierName] = message.text;
      }
    });
  },

  makePredictions: function( callback, classifierName) {
    console.log('kicking off the process of making predictions on the predicting data set for:', classifierName);

    var startPredictionsScript = function() {
      if( global.copyValidationData && classifierName.slice(0,4) !== 'clnn' ) {
        var copyValidationData = true;
        global.copyValidationData = false;
      } else {
        var copyValidationData = false;
      }

      var classifierTrainingObj = global.allTrainingResults[global.allTrainingResults.length -1];
      var classifierTrainingScore = classifierTrainingObj.longTrainScore;

      var pythonOptions = utilsPyShell.generatePythonOptions(argv.predict, [module.exports.dictVectMapping, JSON.stringify(argv), JSON.stringify(module.exports.fileNames), classifierName, module.exports.fileNames.problemType, classifierTrainingScore, copyValidationData ]);

      // if this hyperparameter search did not yield an algorithm that was close enough to our best that it was worth investing in a longTraining, we did not train it and gave it a score of 0. 
      // therefore, we only want to make predictions using this classifier if we actually trained an algorithm successfully (classifierTrainingScore > 0)
      // if( classifierTrainingScore > 0 ) {
      utilsPyShell.startPythonShell('makePredictions.py', callback, pythonOptions);
      // } else {
      //   // ensembler needs to know to not listen for predictions results from this algorithm
      //   process.emit('algoSkippedTraining');
      // }

    };

    startPredictionsScript();

  }

}
