var py = global.pythonNamespace = {};
var exec = require('child_process').exec;
var ensembler = require('ensembler');

var path = require('path');
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

    numberOfClassifiers = classifierList.length;

    ensembler.startListeners( numberOfClassifiers, argv.dataFilePretty, './predictions', argv.ppCompleteLocation );

    // if this is while we are developing, skip over the data-formatter part, as data-formatter is already well tested, and time-consuming.
    if( argv.dev ) {
      utils.fileNames = require('./testingFileNames');
      utils.splitData(function() {
        module.exports.startClassifiers(classifierList);
      });
    } else {
      // here is where we invoke data-formatter to handle all our data formatting needs
        // for more information, please check out that repo!
        // https://github.com/ClimbsRocks/data-formatter
      utils.formatData( function() {
        utils.splitData(function() {
          module.exports.startClassifiers(classifierList);
        });
      });
    }


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
