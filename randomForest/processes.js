var PythonShell = require('python-shell');
var path = require('path');
var utils = require('./utils.js');

module.exports = {

  formatData: function(globals, callback, trainOrPredict) {
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile, trainOrPredict);

    var pyFormatterShell = PythonShell.run('dataFormatting.py', pythonOptions, function (err, results) {
      console.log('inside callback for our dataFormatting.py shell');
      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
      callback();

    });

    // TODO: for some reason we can't get console.logs from this python process
    utils.attachLogListener(pyFormatterShell);
    globals.referencesToChildren.push(pyFormatterShell);

  },

  formatInitialData: function(globals, callback) {
    console.log('inside formatInitialData');
    module.exports.formatData(globals, callback, 'train');
  },

  kickOffForestTraining: function(globals, callback) {
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile);

    var pyTrainerShell = PythonShell.run('training.py', pythonOptions, function (err, results) {
      console.log('inside callback for our training.py shell');

      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      // console.log('results: %j', results);
      callback();

    });
    utils.attachLogListener(pyTrainerShell);
    globals.referencesToChildren.push(pyTrainerShell);

  },

  makePredictions: function(globals, rfPickle) {


    // TODO TODO: pass in the name of the file we are making predictions on
    var pythonOptions = utils.generatePythonOptions(globals.argv.kagglePredict);

    var pyTrainerShell = PythonShell.run('makePredictions.py', pythonOptions, function (err, results) {
      console.log('inside callback for our makePredictions.py shell');

      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      // console.log('results: %j', results);
      // callback();

    });
    utils.attachLogListener(pyTrainerShell);

  }

}
