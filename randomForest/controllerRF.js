var PythonShell = require('python-shell');
var path = require('path');
var rfLocation = path.dirname(__filename);


var referencesToChildren = [];
var dataFileLocation = rfLocation.split('/');
dataFileLocation.pop();
dataFileLocation = dataFileLocation.join('/');

console.log('dataFileLocation:',dataFileLocation);


var formatInitialData = function(argv,callback) {
  console.log('inside formatInitialData');
  var pythonOptions = {
    scriptPath: rfLocation,
    args: [path.join(dataFileLocation,argv.dataFile)],
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
  referencesToChildren.push(pyFormatterShell);
};

var kickOffForestTraining = function(argv, callback) {
  var pythonOptions = {
    scriptPath: rfLocation,
    args: [path.join(dataFileLocation,argv.dataFile)],
    mode: 'json'
  };

  var pyTrainerShell = PythonShell.run('rfTrainer.py', pythonOptions, function (err, results) {
    console.log('inside callback for our rfTrainer.py shell');
    if (err) throw err;
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
  });
  referencesToChildren.push(pyTrainerShell);

}


module.exports = {
  killAll: function() {
    // TODO: kill all child processes
  },
  startTraining: function(argv) {
    console.log('heard start training for random forests');

    if(argv.dev || argv.devKaggle) {
      kickOffForestTraining();

    } else {

      formatInitialData(argv, function() {
        kickOffForestTraining(argv);
      });
      
    }
  }

};
