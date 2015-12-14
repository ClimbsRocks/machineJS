var path = require('path');
var mkdirp = require('mkdirp');
var utils = require(path.join('pySetup','utils.js'));
var classifierListOptions = require(path.join('pySetup', 'classifierList.js'));

module.exports = function() {
  if(argv.dev || argv.devKaggle || argv.devEnsemble) {
    argv.dev = true;
  } else {
    argv.dev = false;
  }


  var dataFile = global.argv.dataFile || process.argv[2];
  argv.computerTotalCPUs = require('os').cpus().length;
  argv.machineJSLocation = path.dirname(__filename);

  // setting defaults if using the --dev or --devKaggle flags (speeds up development time when doing engineering work on the machineJS library itself)
  if( argv.dev ) {
    require('longjohn');
    if (dataFile === undefined) {
      dataFile = 'rossShortTrainDev.csv';
    }
    if ( (argv.devKaggle && !argv.predict) || argv.devEnsemble) {
      argv.predict = argv.predict || 'rossmantest.csv';
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

  // python throws a keyError if you try to look up a key that doesn't exist, so we are explicitly giving it a blank value to ensure the key will exist when we need it later
  argv.join = argv.join || '';
  argv.on = argv.on || '';
  argv.allFeatureCombinations = argv.allFeatureCombinations || '';
  argv.keepAllFeatures = argv.keepAllFeatures || '';
  argv.dfOutputFolder = argv.dfOutputFolder || path.join(argv.machineJSLocation,'pySetup','data-formatterResults');
  argv.matrixOutput = argv.matrixOutput || '';


  argv.testFileName = path.basename( argv.predict );
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
    argv.validationPercent = argv.validationPercent || .3;
  }

  // set out how many combinations of parameters we want to try. 
  // numRounds is how many different times we will run RandomizedSearchCV for that algorithm.
  // so if we have numRounds = 20, we will search for optimal hyperparameters for each algorithm 20 times
  // numIterationsPerRound is how many different combinations of hyperparameters we will attempt for each of those rounds
  if( argv.dev ) {
    argv.numRounds = argv.numRounds || 10;
    argv.numIterationsPerRound = argv.numIterationsPerRound || 5;

  } else {
    argv.numRounds = argv.numRounds || 30;
    argv.numIterationsPerRound = argv.numIterationsPerRound || 10;
    
  }


  argv.predictionsFolder = argv.predictionsFolder || path.join(argv.machineJSLocation, 'predictions', argv.testOutputFileName);
  argv.validationFolder = path.join(argv.predictionsFolder, 'validation');
  argv.bestClassifiersFolder = argv.bestClassifiersFolder || path.join(argv.machineJSLocation, 'pySetup','bestClassifiers',argv.outputFileName);
  mkdirp(argv.predictionsFolder);
  mkdirp(argv.validationFolder);
  mkdirp(argv.bestClassifiersFolder);

  argv.ensemblerOutputFolder = argv.ensemblerOutputFolder || argv.machineJSLocation;


  // the first time we run machineJS, it will just make predictions for a ton of different algos
    // then ensembler will add all these algos on the validation data set.
    // and ask machineJS to try to train a new algo that takes these stage 0 predictions into account
  if( argv.validationRound !== true ) {
    argv.validationRound = false;
  }
  var nextValidationRound = !argv.validationRound;

  argv.ensemblerArgs = {
    inputFolder: argv.predictionsFolder,
    outputFolder: argv.ensemblerOutputFolder,
    validationFolder: argv.validationFolder,
    fileNameIdentifier: argv.outputFileName,
    validationRound: nextValidationRound
  };

  if( argv.binaryOutput ) {
    argv.kaggleBinaryOutputFolder = path.join(argv.predictionsFolder, 'kaggleBinaryOutput');
    mkdirp(argv.kaggleBinaryOutputFolder);
  }

  if( argv.matrixOutput ) {
    argv.matrixOutputFolder = path.join(argv.predictionsFolder, 'matrixOutput');
    mkdirp(argv.matrixOutputFolder);
  }

  // we will eventually be storing information about our trained algorithms here.
  // global.trainedAlgos = {};
  global.allTrainingResults = [];
  global.trainingResultsSummary = {};
  global.trainedAlgoCounts = {};
  global.bestSearchScore = 0;
  global.finishedAlgos = 0;
  global.copyValidationData = true;

  // each classifier is only allowed to take up half the CPUs on the machine.
  // we will be training two in parallel
  // this way, if a single classifier takes so long to train that it effectively fails, we can still train classifiers on the other cores
  argv.numCPUs = argv.numCPUs || Math.round( argv.computerTotalCPUs / 2 ) + 1;

  // we have several different objects in our classifierListOptions, depending on the length of dataset we're training against. 
  // rather than trying to build in the logic of figuring out which one we want, just cycle through them all and add in all the possible options as keys.
  classifierListOptions = classifierListOptions('all');
  for( var algo in classifierListOptions ) {
    global.trainedAlgoCounts[algo] = 0;
  }


  // we are setting the minimum threshold an algorithm must hit in order to justify us training that algorithm for an extended period of time.
  // this comes into play for algorithms that have a considerably longer longTraining time than testing time, such as our random forests with 1200 trees. 
  // it takes only ~3 minutes to do the hyperparameter search, but ~40 to do the long training. we obviously don't want to undertake that long training unless that algo is "good enough". 
  // in this case, good enough is defined as being within 5% of our best algo at that stage in the process. 
  argv.longTrainThreshold = argv.longTrainThreshold || .97;
  argv.continueToTrainThreshold = argv.continueToTrainThreshold || argv.longTrainThreshold;
  
  if( argv.alreadyFormatted === undefined ) {
    if( argv.dev || argv.makePredictions || argv.ensemble ) {
      argv.alreadyFormatted = true;
    } else {
      argv.alreadyFormatted = false;
    }
  }

  if( argv.alreadyFormatted ) {

    if( argv.fileNames !== undefined ) {
      utils.fileNames = argv.fileNames;
    } else {
      var fileNamesOptions = require(path.join('pySetup','testingFileNames.js'));
      utils.fileNames = fileNamesOptions[argv.outputFileName];
      argv.fileNames = utils.fileNames;
    }

    try{
      utils.fileNames = JSON.parse(utils.fileNames);
    } catch(err) {

    }
  }

};
