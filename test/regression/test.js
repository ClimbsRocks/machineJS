var expect = require('chai').expect;
var mocha = require('mocha');
var execSync = require('child_process').execSync;

// this block will contain all the tests for the entire data-formatter package
describe('data-formatter', function() {

  before(function() {
    // remove any folder of testResults that might exist

    // TODO: pass in the outputFolder
    execSync('node ../ppLib.js ../node_modules/data-for-tests/rossman/tinyTrain.csv --kagglePredict ../node_modules/data-for-tests/rossman/test.csv --join ../node_modules/data-for-tests/rossman/store.csv');

  });

  // this timeout should be long enough to handle tests on a variety of machines. If you are getting a timeout error, consider bumping this up even more. 
  this.timeout(600000);

  // TODO: it might make the most sense to just run machineJS all the way through, and then run tests on the final output results
    // this would contrast with what we're doing in data-formatter, where the childProcess is emitting events at the end of each step.
  // TODO: run this separately for each type of problem we're solving (regression, category, then eventually multi-labe, etc.)
  // global.testNamespace.mjsChildProcess = 

  setDefaultArgs();

  // splitDataset();

  // trainAlgos();

  // makePredictions();


});
