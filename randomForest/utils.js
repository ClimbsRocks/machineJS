var path = require('path');
var PythonShell = require('python-shell');

var rfLocation = path.dirname(__filename);

var dataFileLocation = rfLocation.split('/');
dataFileLocation.pop();
dataFileLocation = dataFileLocation.join('/');

module.exports = {
  expectedMessages: {
    dictVectMapping: true
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
    var fullPathToFile = dataFileLocation + '/' + fileNameFromRoot;
    var args = [];
    args = args.concat(fullPathToFile, otherArgs);
    return {
      scriptPath: rfLocation,
      args: args,
      mode:'json'
    };
  },

  startPythonShell: function(scriptName, callback, pythonOptions, referencesToChildren) {
    var pyShell = PythonShell.run(scriptName, pythonOptions, function (err, results) {
      console.log('finished running',scriptName + '!');
      if (err) console.error(err);
      callback();
    });

    module.exports.attachLogListener(pyShell);
    referencesToChildren.push(pyShell);

    return pyShell;
  }

}
