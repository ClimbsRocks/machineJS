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
    // kick off training, and then, once that is done, invoke the callback, which starts the process of making predictions
    utils.kickOffTraining( function() {
      module.exports.makePredictions(classifierName);
    }, classifierName);
    
  }
};



module.exports = {
  killAll: function() {
    // kill all child processes
    for (var i = 0; i < py.referencesToChildren.length; i++) {
      py.referencesToChildren[i].childProcess.kill();
    }

    // this is frequently not killing all the child processes of that child process. so if our python shell is running 8 other python scripts to spread the training out around all the cores, those 8 other python scripts are continuing to run after the above. 
    // the following command will be executed on the command line and will kill all Python processes. 
    // the unfortunate side effect is that any unrelated Python processes running on this machine will also be killed. But since this library takes up all the cores on the machine anyways, the user would likely have a very hard time running other Python scripts simultaneously regardless. 
    exec('pkill -9 Python');
  },

  startClassifiers: function(classifierList) {

    startOneClassifier(classifierList);
    startOneClassifier(classifierList);
    
    process.on('algoFinishedTraining', function() {
      startOneClassifier(classifierList);
    });

  },

  startTraining: function() {
    // each classifier is only allowed to take up half the CPUs on the machine.
    // we will be training two in parallel
    // this way, if a single classifier takes so long to train that it effectively fails, we can still train classifiers on the other cores
    argv.numCPUs = argv.numCPUs || Math.round( argv.computerTotalCPUs / 2 ) + 1;
    console.log('we are starting to train all the machine learning algorithms!');


    if( argv.dev ) {
      var classifierList = classifierOptions.dev;
    } else if( utils.fileNames.trainingDataLength < 10000 ) {
      var classifierList = classifierOptions.shortDataSet;
    } else {
      var classifierList = classifierOptions.longDataSet;
    }
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

    ensembler.startListeners( numberOfClassifiers, argv.ensemblerArgs);

    // if this is while we are developing, skip over the data-formatter part, as data-formatter is already well tested, and time-consuming.
    if( argv.alreadyFormatted ) {
      utils.fileNames = require('./testingFileNames');
      try {
        utils.fileNames = JSON.parse(utils.fileNames);
      } catch( err ) {
        // do nothing! it's already valid JS
        // console.error(err);
      }
      utils.fileNames 
      // TODO: 
      // if we already have the split file names, use those.
      // that allows us to ensure more continuity as you make other tweaks, rather than introducing randomness through sample selection that might overwhelm the effects of other changes you're trying to make. 
      utils.splitData(function() {
        module.exports.startClassifiers(classifiersByRound);
      });
    } else {
      // here is where we invoke data-formatter to handle all our data formatting needs
        // for more information, please check out that repo!
        // https://github.com/ClimbsRocks/data-formatter
      utils.formatData( function() {
        utils.splitData(function() {
          module.exports.startClassifiers(classifiersByRound);
        });
      });
    }

  },

  makeAllPredictions: function(folderName) {
    // eventually, we will take in a folderName where our bestClasifiers are stored, and only make predictions against those classifiers
    // TODO: start listeners for ensembler
    
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

    // var madeNoise = false;
    utils.makePredictions( function() {
      process.emit('algoFinishedPredicting');
      // if(!madeNoise) {
      //   console.log('when you came to a fork in the woods, you trained a machine to explore not just all the immediate possibilities down either side, but all the forks that came after that.');
      // }
    }, classifierName);
  }

};
