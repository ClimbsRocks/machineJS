var path = require('path');
var mkdirp = require('mkdirp');
var utils = require(path.join('pySetup','utils.js'));

module.exports = function() {
  if(argv.dev || argv.devKaggle || argv.devEnsemble) {
    argv.dev = true;
  } else {
    argv.dev = false;
  }


  var dataFile = process.argv[2];
  argv.computerTotalCPUs = require('os').cpus().length;
  argv.ppCompleteLocation = path.dirname(__filename);

  // setting defaults if using the --dev or --devKaggle flags (speeds up development time when doing engineering work on the ppComplete library itself)
  if( argv.dev ) {
    require('longjohn');
    if (dataFile.slice(-4) !== '.csv') {
      dataFile = 'rossShortTrainDev.csv'
    }
    if ( (argv.devKaggle && !argv.kagglePredict) || argv.devEnsemble) {
      argv.kagglePredict = 'rossmantest.csv';
    }
  }

  argv.dataFile = dataFile;
  argv.dataFileName = path.basename( argv.dataFile );
  argv.dataFilePretty = argv.dataFileName.slice(0,-4);
  argv.binaryOutput = argv.binaryOutput || false; //python doesn't like undefined, so explicitly set this to false if it does not exist
  argv.outputFileName = argv.dataFilePretty;
  if( argv.outputFileName === 'train' ) {
    dataFileFolder = path.parse(argv.dataFile).dir.split(path.sep).pop();
    argv.outputFileName = dataFileFolder + argv.dataFilePretty;
  }

  argv.testFileName = path.basename( argv.kagglePredict );
  argv.testFilePretty = argv.testFileName.slice(0,-4);
  argv.testOutputFileName = argv.testFilePretty;

  if( argv.testOutputFileName === 'test' ) {
    dataFileFolder = path.parse(argv.dataFile).dir.split(path.sep).pop();
    argv.testOutputFileName = dataFileFolder + argv.testFilePretty;
  }

  // in splitDatasets.py, we are going to break our data out into three groups:
    // 1. The group we run the hyperparameter search over (GridSearchCV or RandomizedSearchCV).
      // Since the best hyperparameters for a random subset of the data are going to be the same as the entire dataset, 
      // we run the search on only a subset of the data to drastically speed up search time
    // 2. The training data we will train our (now-optimized) algorithm on. 
      // Now that we have our best hyperparameters, create an algorithm with those parameters, and train it only a larger portion of our overall dataset. 
    // 3. The validation set. This is a holdout set we do not include in the training set. 
      // We use this to test how well our algorithm generalizes to data it hasn't seen yet. 
      // We also use this, later down the road, for ensembler to create stacked/blended ensembles with.
      // For a given test.csv dataset, we will determine the validation dataset once, and then use that each time.
      // This means that we can include all the algorithms you've trained on this dataset in our ensembling. 
      // This lets you change how you format the data (normalization, scaling, new feature engineering, etc.), and still use all these algorithms in the final ensemble.
      // You can easily start over with a new validation set by simply deleting the validation.pkl file saved next to your test.csv file.
  if( argv.dev ) {
    argv.searchPercent = argv.searchPercent || .1;
    argv.validationPercent = argv.validationPercent || .85;
  } else {
    argv.searchPercent = argv.searchPercent || .3;
    argv.validationPercent = argv.validationPercent || .2;
  }


  argv.predictionsFolder = argv.predictionsFolder || path.join(argv.ppCompleteLocation, 'predictions', argv.testOutputFileName);
  argv.validationFolder = path.join(argv.predictionsFolder, 'validation');
  argv.bestClassifiersFolder = argv.bestClassifiersFolder || path.join(argv.ppCompleteLocation, 'pySetup','bestClassifiers',argv.outputFileName);
  mkdirp(argv.predictionsFolder);
  mkdirp(argv.validationFolder);
  mkdirp(argv.bestClassifiersFolder);

  argv.ensemblerOutputFolder = argv.ensemblerOutputFolder || argv.ppCompleteLocation;

  argv.ensemblerArgs = {
    inputFolder: argv.predictionsFolder,
    outputFolder: argv.ensemblerOutputFolder,
    validationFolder: argv.validationFolder,
    fileNameIdentifier: argv.outputFileName
  };

  if( argv.binaryOutput ) {
    argv.kaggleBinaryOutputFolder = path.join(predictionsFolder, 'kaggleBinaryOutput');
    mkdirp(argv.kaggleBinaryOutputFolder);
  }

  // we will eventually be storing information about our trained algorithms here.
  global.trainedAlgos = {};
  global.finishedAlgos = 0;

  
  if( argv.alreadyFormatted === undefined ) {
    if( argv.dev || argv.makePredictions ) {
      argv.alreadyFormatted = true;
    } else {
      argv.alreadyFormatted = false;
    }
  }


  if( argv.alreadyFormatted ) {
    utils.fileNames = require(path.join('pySetup','testingFileNames.js'));
    try{
      utils.fileNames = JSON.parse(utils.fileNames);
    } catch(err) {

    }
  }

};
