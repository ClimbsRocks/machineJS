var PythonShell = require('python-shell');
var path = require('path');

module.exports = {
  attachLogListener: function(referenceToShell) {
    referenceToShell.on('message', function(message) {
      if(message.type === 'console.log') {
        console.log('snake says:',message.text);
      }
      else {
        console.log('heard a message:',message);
      }
    });
  },

  formatInitialData: function(globals, callback) {
    console.log('inside formatInitialData');
    var pythonOptions = {
      scriptPath: globals.rfLocation,
      args: [path.join(globals.dataFileLocation,globals.argv.dataFile)],
      mode: 'json'
    };
    var pyFormatterShell = PythonShell.run('dataFormatting.py', pythonOptions, function (err, results) {
      console.log('inside callback for our dataFormatting.py shell');
      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
      callback();

    });

    // TODO: for some reason we can't get console.logs from this python process
    module.exports.attachLogListener(pyFormatterShell);
    globals.referencesToChildren.push(pyFormatterShell);
  },

  kickOffForestTraining: function(globals, callback) {
    var pythonOptions = {
      scriptPath: globals.rfLocation,
      args: [path.join(globals.dataFileLocation,globals.argv.dataFile)],
      mode: 'json'
    };

    var pyTrainerShell = PythonShell.run('training.py', pythonOptions, function (err, results) {
      console.log('inside callback for our training.py shell');

      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      // console.log('results: %j', results);
      callback();

    });
    module.exports.attachLogListener(pyTrainerShell);
    globals.referencesToChildren.push(pyTrainerShell);

  },

  makePredictions: function(globals, rfPickle) {
    console.log('globals:',globals);
    // TODO TODO: pass in the name of the file we are making predictions on
    var pythonOptions = {
      scriptPath: globals.rfLocation,
      args: [path.join(globals.dataFileLocation,globals.argv.kagglePredict)],
      mode: 'json'
    };

    var pyTrainerShell = PythonShell.run('makePredictions.py', pythonOptions, function (err, results) {
      console.log('inside callback for our makePredictions.py shell');

      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      // console.log('results: %j', results);
      callback();

    });
    module.exports.attachLogListener(pyTrainerShell);

  }

}
