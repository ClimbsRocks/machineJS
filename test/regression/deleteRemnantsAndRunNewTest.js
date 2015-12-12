var path = require('path');
var execSync = require('child_process').execSync;
var rimraf = require('rimraf');
var fs = require('fs');

// set default values
// since node.js executes the file as node loads the file in, these lines of code will get run every time, regardless of whether we run the module.exports function or not
global.rTest.testFileLocation = path.dirname(__filename);
global.rTest.mjsLocation = path.join(rTest.testFileLocation, '..','..');
global.rTest.dataLocation = path.join(rTest.mjsLocation,'node_modules','data-for-tests','rossman');

rTest.dfTestResultsLocation = path.join(rTest.testFileLocation, 'dfTestResults');
rTest.rTestPredictionsLocation = path.join(rTest.testFileLocation, 'rTestPredictions');
rTest.bestClassifiersTestLocation = path.join(rTest.testFileLocation, 'bestClassifiersTest');
rTest.validationIndicesLocation = path.join(rTest.dataLocation, 'dfValidationIndicesrossmantest.pkl');


module.exports = function() {
 try {
    // remove any folders we might have created when running the test suite previously
    // rimraf is `rm -rf` for node
    rimraf.sync(rTest.dfTestResultsLocation);
    rimraf.sync(rTest.rTestPredictionsLocation);
    rimraf.sync(rTest.bestClassifiersTestLocation);
    fs.unlinkSync(rTest.validationIndicesLocation);
  } catch(err) {
    // do nothing! There is nothing to delete
  }

  // to see detailed output while running the tests, use node-inspector.
    // npm install -g node-inspector
    // change "node" below to be "node-debug"
  execSync('node machineJS.js ' 
    + path.join(rTest.dataLocation,'tinyTrain.csv') 
    + ' --predict ' + path.join(rTest.dataLocation,'test.csv') 
    + ' --join ' + path.join(rTest.dataLocation, 'store.csv') 
    + ' --dfOutputFolder ' + path.join(rTest.testFileLocation, 'dfTestResults')
    + ' --predictionsFolder ' + path.join(rTest.testFileLocation, 'rTestPredictions')
    + ' --ensemblerOutputFolder ' + rTest.testFileLocation
    + ' --bestClassifiersFolder ' + path.join(rTest.testFileLocation, 'bestClassifiersTest')
  );
};
