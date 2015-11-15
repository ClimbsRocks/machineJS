var expect = require('chai').expect;
var mocha = require('mocha');
var execSync = require('child_process').execSync;
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');

var makePredictions = require('./makePredictions');
var splitDataset = require('./splitDataset');
var trainAlgorithms = require('./trainAlgorithms');

var testFileLocation = path.dirname(__filename);
var dataLocation = path.join(testFileLocation, '..','..','node_modules','data-for-tests','rossman');

console.log('dataLocation',dataLocation);

// this block will contain all the tests for the entire data-formatter package
describe('regression problems', function() {
  this.timeout(600000);

  before(function(done) {

    try {
      // remove any folders we might have created when running the test suite previously
      // rimraf is `rm -rf` for node
      rimraf.sync(path.join(testFileLocation, 'dfTestResults'));
      rimraf.sync(path.join(testFileLocation, 'regressionTestPredictions'));
      rimraf.sync(path.join(testFileLocation, 'bestClassifiersTest'));
      fs.unlinkSync(path.join(dataLocation, 'dfValidationIndicesrossmantest.pkl'));
      
    } catch(err) {
    }

    // to see detailed output while running the tests, use node-inspector.
      // npm install -g node-inspector
      // change "node" below to be "node-debug"
    execSync('node ppLib.js ' 
      + path.join(dataLocation,'tinyTrain.csv') 
      + ' --kagglePredict ' + path.join(dataLocation,'test.csv') 
      + ' --join ' + path.join(dataLocation, 'store.csv') 
      + ' --dfOutputFolder ' + path.join(testFileLocation, 'dfTestResults')
      + ' --predictionsFolder ' + path.join(testFileLocation, 'regressionTestPredictions')
      + ' --ensemblerOutputFolder ' + testFileLocation
      + ' --bestClassifiersFolder ' + path.join(testFileLocation, 'bestClassifiersTest')
    );

    done();

  });

  // this timeout should be long enough to handle tests on a variety of machines. If you are getting a timeout error, consider bumping this up even more. 

  // TODO: it might make the most sense to just run machineJS all the way through, and then run tests on the final output results
    // this would contrast with what we're doing in data-formatter, where the childProcess is emitting events at the end of each step.
  // TODO: run this separately for each type of problem we're solving (regression, category, then eventually multi-labe, etc.)
  // global.testNamespace.mjsChildProcess = 

  // setDefaultArgs();

  splitDataset();

  trainAlgorithms();

  makePredictions();


});
