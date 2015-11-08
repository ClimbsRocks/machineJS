var path = require('path');

module.exports = function() {
  if(argv.dev || argv.devKaggle) {
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

  argv.searchPercent = argv.searchPercent || .3;
  argv.validationPercent = argv.validationPercent || .2;

  
  if( argv.alreadyFormatted === undefined ) {
    if( argv.dev ) {
      argv.alreadyFormatted = true;
    } else {
      argv.alreadyFormatted = false;
    }
  }

};
