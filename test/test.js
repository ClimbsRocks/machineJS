var expect = require('chai').expect;
var mocha = require('mocha');

// this block will contain all the tests for the entire data-formatter package
describe('data-formatter', function() {

  // this timeout should be long enough to handle tests on a variety of machines. If you are getting a timeout error, consider bumping this up even more. 
  this.timeout(600000);

  // TODO: it might make the most sense to just run machineJS all the way through, and then run tests on the final output results
    // this would contrast with what we're doing in data-formatter, where the childProcess is emitting events at the end of each step.
  // global.testNamespace.mjsChildProcess = 

  setDefaultArgs();

  // splitDataset();

  // trainAlgos();

  // makePredictions();


});
