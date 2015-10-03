var PythonShell = require('python-shell');
var path = require('path');

module.exports = {
  formatInitialData: function(globals, callback) {
    console.log('inside formatInitialData');
    var pythonOptions = {
      scriptPath: globals.rfLocation,
      args: [path.join(globals.dataFileLocation,globals.argv.dataFile)],
      mode: 'json'
    };
    var pyFormatterShell = PythonShell.run('rfDataFormatting.py', pythonOptions, function (err, results) {
      console.log('inside callback for our rfDataFormatting.py shell');
      if (err) throw err;
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
      // TODO: inside this callback, now we can start spinning up child_processes to actually run a random forest. 
      callback();

    });

    // TODO: for some reason we can't get console.logs from this python process
    pyFormatterShell.on('message', function(message) {
      console.log('heard a message from the snake:',message);
      if(message.type === 'console.log') {
        console.log('snake says:',message.text);
      }
    });
    globals.referencesToChildren.push(pyFormatterShell);
  },

  kickOffForestTraining: function(globals, callback) {
    var pythonOptions = {
      scriptPath: globals.rfLocation,
      args: [path.join(globals.dataFileLocation,globals.argv.dataFile)],
      mode: 'json'
    };

    var pyTrainerShell = PythonShell.run('rfTrainer.py', pythonOptions, function (err, results) {
      console.log('inside callback for our rfTrainer.py shell');

      if (err) console.error(err);
      console.log('got results back');
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
      // TODO: inside this callback, now we can start spinning up child_processes to actually run a random forest. 
      callback();

    });
    pyTrainerShell.on('message', function(message) {
      if(message.type === 'console.log') {
        console.log('snake says:',message.text);
      }
      else {
        console.log('heard a message:',message);
      }

    });
    globals.referencesToChildren.push(pyTrainerShell);

  }

}
