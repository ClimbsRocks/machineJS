var path = require('path');

var rfLocation = path.dirname(__filename);

var dataFileLocation = rfLocation.split('/');
dataFileLocation.pop();
dataFileLocation = dataFileLocation.join('/');

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

  generatePythonOptions: function(fileNameFromRoot, otherArgs) {
    var fullPathToFile = dataFileLocation + '/' + fileNameFromRoot;
    var args = [];
    args = args.concat(fullPathToFile, otherArgs);
    return {
      scriptPath: rfLocation,
      args: args,
      mode:'json'
    };
  }

}
