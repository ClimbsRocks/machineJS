var py = global.pythonNamespace = {};
var exec = require('child_process').exec;
var ensembler = require('ensembler');

var path = require('path');
var fs = require('fs');
var pySetupLocation = path.dirname(__filename);
py.pySetupLocation= pySetupLocation;
py.referencesToChildren= [];
var utils = require('./utils.js');
var classifierOptions = require('./classifierList.js');

argv = global.argv;

var startOneClassifier = function(classifierList) {

  if( classifierList.length > 0 ) {
    // for our last classifier, tell it to run on all cores on the machine
    // this way, when the second-to-last classifier finishes, and those half the machine cores are empty, we can put them to use!
    if( classifierList.length === 1 ) {
      argv.numCPUs = argv.computerTotalCPUs;
    }

    var classifierName = classifierList.shift();

    var algosBestScore = global.allTrainingResults[classifierName];

    // if we have trained more than three of this algorithm, and it's best score is not within X percent of the best we've found so far, don't both training another one. 
    if( global.trainedAlgoCounts[classifierName] < 3 || algosBestScore > global.bestSearchScore * argv.continueToTrainThreshold ) {
      // kick off training, and then, once that is done, invoke the callback, which starts the process of making predictions
      utils.kickOffTraining( function() {
        module.exports.makePredictions(classifierName);
      }, classifierName);

    } else {
      // since we said at the start to expect a certain number of algorithms to be trained, we must still emit an event to notify ensembler that we are skipping over an algorithm
      process.emit('algoSkippedTraining');
    }

    
  }
};


module.exports = {
  killAll: function() {
    // kill all child processes
    for (var i = 0; i < py.referencesToChildren.length; i++) {
      py.referencesToChildren[i].childProcess.kill();
    }

    // following the .kill() routine for each child is frequently not killing all the child processes of that child process. so if our python shell is running 8 other python scripts to spread the training out around all the cores, those 8 other python scripts are continuing to run after the above. 
    // the following command will be executed on the command line and will kill all Python processes. 
    // the unfortunate side effect is that any unrelated Python processes running on this machine will also be killed. But since this library takes up all the cores on the machine anyways, the user would likely have a very hard time running other Python scripts simultaneously regardless. 
    exec('pkill -9 Python');
  },

  startClassifiers: function(classifierList) {
    var classifiersByRound = module.exports.makeClassifierList();

    startOneClassifier(classifiersByRound);
    startOneClassifier(classifiersByRound);


    // whenever one estimator finishes training (or has not performed well enough in training so far to justify training another instance of it), we want to start training another!
    process.on('algoFinishedTraining', function() {
      startOneClassifier(classifiersByRound);
    });

    process.on('algoSkippedTraining', function() {
      startOneClassifier(classifiersByRound);
    });

  },

  makeClassifierList: function() {
    var classifierList = classifierOptions(utils.fileNames.problemType, utils.fileNames.trainingDataLength);

    classifierList = Object.keys( classifierList );
    var classifiersByRound = [];

    // we are going to get many trained classifiers from this!
    // let's talk through an example:
    // say we want to run 100 iterations of RandomizedSearchCV
      // we could run a single round of rsCV with 100 iterations, and get a single trained classifier out of it at the end
      // or, we could run 10 rounds, with 10 iterations each, and have 10 trained classifiers at the end!
    // ensembler works best when it has more predictions to work with, so this second option is immediately appealling
    // the second option is also appealling in that we will have a bunch of midway results
      // say running 100 iterations takes 100 hours
      // and we end up only having 90 hours
      // if we split this up into multiple rounds, we will now have 8 or 9 algorithms trained by this point, one of which is likely the best one
      // whereas if it were an all-or-nothing game of having to get to all 100, we would have nothing.
    // another thing that's appealling about running multiple rounds is it let's us test more algorithms against the valdiation data set. it's somewhat difficult to predict how each algorithm is going to generalize, so having a chance to actually test them against the validation data set gives us more options
    // the drawback is that it will take more time (training a "bigger" version of the selected algorithm 10 times is not trivial, nor is running 10 rounds of predictions against the validation and test data sets)
    for( var i = 0; i < argv.numRounds; i++) {
      for( var j = 0; j < classifierList.length; j++) {
        classifiersByRound.push(classifierList[j]);
      }
    }

    numberOfClassifiers = classifiersByRound.length;

    // tell ensembler how many algos to wait for before ensembler takes over
    ensembler.startListeners( numberOfClassifiers, argv.ensemblerArgs);

    return classifiersByRound;
  },

  startTraining: function() {

    if( argv.validationRound ) {
      module.exports.startClassifiers();
      
    } else if( argv.alreadyFormatted ) {
    // if we have already formatted the data, skip over repeating that step. This allows us to train more classifiers rapidly without repeating the oftentimes lengthy data formatting process. 
      // TODO TODO: do not start splitDatasets
        // we need to get the fileNames
          // grab them from within ensembler before invoking machineJS a second time
            // make fileNames part of the global.argv object in machineJS
        // and we will need to build in some logic to training.py to have it not split out the data, make predictions on the raw validation dataset, etc. 
      utils.splitData(function() {
        module.exports.startClassifiers();
      });
    } else {
      // here is where we invoke data-formatter to handle all our data formatting needs
        // for more information, please check out that repo!
        // https://github.com/ClimbsRocks/data-formatter
      utils.formatData( function() {
        utils.splitData(function() {
          module.exports.startClassifiers();
        });
      });
    }

  },

  // TODO: likely deprecate this functionality. 
  makeAllPredictions: function(folderName) {
    // we are taking in a folderName where our results are stored, and only making predictions against those classifiers
    
    fs.readdir(folderName, function(err,files) {
      if (err) {
        console.error('there are no files in the input folder',folderName);

        console.error("We need the pickled (.pkl) results of the trained classifiers saved into their own folders within this folder. Please make sure that this is the right folder, and that you have properly saved each classifier into it's own directory within this folder.");
      } else { 
        var numberOfClassifiers = files.length;
        ensembler.startListeners( numberOfClassifiers, argv.ensemblerArgs);
        files.forEach(function(fileName) {
          // our file names already have "best" in them, but our makePredictions script is just expecting the classifierName itself, without "best"
          fileName = fileName.slice(4);
          module.exports.makePredictions(fileName);
        });
      }
    });

  },

  makePredictions: function(classifierName) {

    utils.makePredictions( function() {
      process.emit('algoFinishedPredicting');
    }, classifierName);
  }

};
