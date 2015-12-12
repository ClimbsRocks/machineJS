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
    // the first argument for all python shells is going to be a path to a file, relative to the root of machineJS
    var fullPathToFile = path.join(global.rootDir, fileNameFromRoot);
    var args = [];
    args = args.concat(fullPathToFile, otherArgs);

    var pySetupLocation = path.join(argv.machineJSLocation, 'pySetup');

    return {
      scriptPath: pySetupLocation,
      args: args,
      mode:'json'
    };
  },

  startPythonShell: function(scriptName, callback, pythonOptions) {
    var pyShell = PythonShell.run(scriptName, pythonOptions, function (err, results) {
      if (err) {
        // TODO: add in logging of the error message if verbosity is set to
        // right now we get error messages for a bunch of things the user should not concern themselves with, including:
          // deprecation warnings (we're optionally using a pre-release version of sklearn; we'll refactor to take care of those deprecation warnings once they're merged into an officially released version)
          // searches that fail to converge
        // to avoid distracting the user, we're only logging error messages with an exit code that is not 0, meaning that the process failed to finish executing
        if( err.exitCode !== 0 ) {
          console.error(err);
        } 
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
