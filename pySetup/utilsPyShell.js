var py = global.pythonNamespace;

var path = require('path');
var PythonShell = require('python-shell');

var pySetupLocation = py.pySetupLocation;

module.exports = {

  // these are messages we expect to get from our python shell.
  // anything not in this list is likely an error.
  expectedMessages: {
    dictVectMapping: true,
    fileNames: true,
    trainingResults: true,
    splitFileNames: true
  },

  attachLogListener: function(referenceToShell) {
    referenceToShell.on('message', function(message) {
      if(message.type === 'console.log') {
        console.log('snake says:',message.text);
      }
      else if ( !module.exports.expectedMessages[ message.type ] ){
        console.log('heard a message:',message);
      }
    });
  },

  generatePythonOptions: function(fileNameFromRoot, otherArgs) {
    // the first argument for all python shells is going to be a path to a file, relative to the root of ppLib
    var fullPathToFile = global.rootDir + '/' + fileNameFromRoot;
    var args = [];
    args = args.concat(fullPathToFile, otherArgs);
    return {
      scriptPath: pySetupLocation,
      args: args,
      mode:'json'
    };
  },

  startPythonShell: function(scriptName, callback, pythonOptions) {
    var pyShell = PythonShell.run(scriptName, pythonOptions, function (err, results) {
      if (err) {
        console.error(err);
      } else {
        console.log('successfully finished running',scriptName + '!');

      }
      callback();
    });

    module.exports.attachLogListener(pyShell);
    py.referencesToChildren.push(pyShell);

    return pyShell;
  }

}
