var path = require('path');
var utils = require('./utils.js');

module.exports = {

  formatData: function(globals, callback, trainOrPredict) {
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile, trainOrPredict);

    utils.startPythonShell('dataFormatting.py', callback, pythonOptions, globals.referencesToChildren);

  },

  formatInitialData: function(globals, callback) {
    console.log('inside formatInitialData');
    module.exports.formatData(globals, callback, 'train');
  },

  kickOffForestTraining: function(globals, callback) {
    var pythonOptions = utils.generatePythonOptions(globals.argv.dataFile);

    utils.startPythonShell('training.py', callback, pythonOptions, globals.referencesToChildren);
    // var pyTrainerShell = PythonShell.run('training.py', pythonOptions, function (err, results) {
    //   console.log('inside callback for our training.py shell');

    //   if (err) console.error(err);
    //   console.log('got results back');
    //   // results is an array consisting of messages collected during execution
    //   // console.log('results: %j', results);
    //   callback();

    // });
    // utils.attachLogListener(pyTrainerShell);
    // globals.referencesToChildren.push(pyTrainerShell);

  },

  makePredictions: function(globals, callback, rfPickle) {


    // TODO TODO: pass in the name of the file we are making predictions on
    var pythonOptions = utils.generatePythonOptions(globals.argv.kagglePredict);

    utils.startPythonShell('makePredictions.py', pythonOptions, callback, globals.referencesToChildren);

    // var pyTrainerShell = PythonShell.run('makePredictions.py', pythonOptions, function (err, results) {
    //   console.log('inside callback for our makePredictions.py shell');

    //   if (err) console.error(err);
    //   console.log('got results back');
    //   // results is an array consisting of messages collected during execution
    //   // console.log('results: %j', results);
    //   // callback();

    // });
    // utils.attachLogListener(pyTrainerShell);

  }

}
