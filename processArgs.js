var path = require('path');
var mkdirp = require('mkdirp');
// we will soon save path.dirname(__filename) into argv.machineJSLocation, but to get all this started by loading our require statements, we'll type it in directly here
var utils = require(path.join(path.dirname(__filename), 'pySetup','utils.js'));
var classifierListOptions = require(path.join(path.dirname(__filename), 'pySetup', 'classifierList.js'));

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

  /*
  in splitDatasets.py, we are going to break our data out into three groups:
    1. The group we run the hyperparameter search over (GridSearchCV or RandomizedSearchCV).
      Since the best hyperparameters for a random subset of the data are going to be the same as the entire dataset, 
      we run the search on only a subset of the data to drastically speed up search time
    2. The training data we will train our (now-optimized) algorithm on. 
      Now that we have our best hyperparameters, create an algorithm with those parameters, and train it on a larger portion of our overall dataset. 
    3. The validation set. This is a holdout set we do not include in the training set. 
      We use this to test how well our algorithm generalizes to data it hasn't seen yet. 
      We also use this, later down the road, for ensembler to create stacked/blended ensembles with.
      For a given test.csv dataset, we will determine the validation dataset once, and then use that each time.
      This means that we can include all the algorithms you've trained on this dataset in our ensembling. 
      This lets you change how you format the data (normalization, scaling, new feature engineering, etc.), and still use all these algorithms in the final ensemble.
      You can easily start over with a new validation set by simply deleting the validation.pkl file saved next to your test.csv file.
    */
  if( argv.dev ) {
    argv.searchPercent = argv.searchPercent || .1;
    argv.validationPercent = argv.validationPercent || .85;
  } else {
    argv.searchPercent = argv.searchPercent || .3;
    argv.validationPercent = argv.validationPercent || .3;
  }

  /*
  set out how many combinations of parameters we want to try. 
  numRounds is how many different times we will run RandomizedSearchCV for that algorithm.
  so if we have numRounds = 20, we will search for optimal hyperparameters for each algorithm 20 times
  numIterationsPerRound is how many different combinations of hyperparameters we will attempt for each of those rounds
  so numIterationsPerRound = 10 means we will try 10 different combinations of hyperparameters each round. 
  for competitions, more numRounds and lower numIterationsPerRound is ideal. In that case, we have more material to feed into ensembler, since we will have more algos trained at the end. For production environments, fewer numRounds and much higher numIterationsPerRound means that each of the algos we train will be higher quality. We will probably miss out on accuracy to a tiny degree, but we will need far fewer algos to accomplish this, which will be much more efficient in a production environment. 
  */

  if( argv.dev ) {
    argv.numRounds = argv.numRounds || 5;
    argv.numIterationsPerRound = argv.numIterationsPerRound || 5;

  } else {
    argv.numRounds = argv.numRounds || 10;
    argv.numIterationsPerRound = argv.numIterationsPerRound || 10;
    
  }


  // keep track of where we will be saving data during all of the intermediate stages
  argv.predictionsFolder = argv.predictionsFolder || path.join(argv.machineJSLocation, 'predictions', argv.testOutputFileName);
  argv.validationFolder = path.join(argv.predictionsFolder, 'validation');
  argv.bestClassifiersFolder = argv.bestClassifiersFolder || path.join(argv.machineJSLocation, 'pySetup','bestClassifiers',argv.outputFileName);
  // create these folders if they do not already exist
  mkdirp(argv.predictionsFolder);
  mkdirp(argv.validationFolder);
  mkdirp(argv.bestClassifiersFolder);

  // allow the user to specify a different location for the output
  argv.ensemblerOutputFolder = argv.ensemblerOutputFolder || argv.machineJSLocation;

  /*
  the first time we run machineJS, it will just make predictions for a ton of different algos
    then ensembler will add all the predictions of these algo to the validation data. 
    in other words, for each row of data, we will now have the original input data (height = 5'2", gender = female, etc.), as well as the predictions from all the stage 0 predictors (randomForest says .99 probability, MLP says .997 probability, perceptron says .97, etc.).
    then ensembler asks machineJS to try to train a new algo that takes these stage 0 predictions into account
  */
  // keep track of whether this is the validation round or the original stage 0 round
  if( argv.validationRound !== true ) {
    argv.validationRound = false;
  }
  var nextValidationRound = !argv.validationRound;

  // these are the arguments we will pass to ensembler
  argv.ensemblerArgs = {
    inputFolder: argv.predictionsFolder,
    outputFolder: argv.ensemblerOutputFolder,
    validationFolder: argv.validationFolder,
    fileNameIdentifier: argv.outputFileName,
    validationRound: nextValidationRound
  };

  // sometimes we want the probability (.97), sometimes we just want a binary yes or no (1)
  if( argv.binaryOutput ) {
    argv.kaggleBinaryOutputFolder = path.join(argv.predictionsFolder, 'kaggleBinaryOutput');
    mkdirp(argv.kaggleBinaryOutputFolder);
  }

  // sometimes we want matrix output. This is useful when we are trying to, say, categorize a shopper into one of 12 different categories. With matrix output, each of those 12 categories will come out as their own column, with a 0 or 1, as opposed to a single column with values from 1 - 12.
  // this hasn't been tested in a while. 
  if( argv.matrixOutput ) {
    argv.matrixOutputFolder = path.join(argv.predictionsFolder, 'matrixOutput');
    mkdirp(argv.matrixOutputFolder);
  }

  // store information on all the algos we've trained so far
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
  // rather than trying to build in the logic of figuring out which ones we want before we have formatted and understood our data, just add in all the possible options as keys.
  classifierListOptions = classifierListOptions('all');
  for( var algo in classifierListOptions ) {
    global.trainedAlgoCounts[algo] = 0;
  }


  // we are setting the minimum threshold an algorithm must hit in order to justify us training that algorithm for an extended period of time.
  // this comes into play for algorithms that have a considerably longer longTraining time than testing time, such as our random forests with 1200 trees. 
  // it takes only ~3 minutes to do the hyperparameter search, but ~40 to do the long training. we obviously don't want to undertake that long training unless that algo is "good enough". 
  // in this case, good enough is defined as being within 3% of our best algo at that stage in the process. 
  argv.longTrainThreshold = argv.longTrainThreshold || .97;
  argv.continueToTrainThreshold = argv.continueToTrainThreshold || argv.longTrainThreshold;
  
  // formatting our data can take a long time. Unless you're performing additional feature engineering, the results are basically the same every time we run data-formatter. So, we can save ourselves a lot of time by just using the previously calculated results from data-formatter. 
  // the entire process the user follows when using previously formatted data is exactly the same as formatting the data anew. You must pass in the exact same arguments to machineJS as you would to run data-formatter from scratch- we depend on that information you're passing in. 
  // take in a flag to tell machineJS that we want to use previously formatted data. This is always the case when the dev flags have been passed in.
  if( argv.alreadyFormatted === undefined ) {
    if( argv.dev || argv.ensemble ) {
      argv.alreadyFormatted = true;
    } else {
      argv.alreadyFormatted = false;
    }
  }

  // if we are using previously formatted data, load in the names of the right files from machineJS/pySetup/testingFileNames.js. Follow instructions in that file for more information on the exact format expected.
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
