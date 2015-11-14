var expect = require('chai').expect;
var mocha = require('mocha');

describe('training and tuning algorithms', function() {
  before(function(done) {
      global.testNamespace.mjsChildProcess.on('trained', function() {
        done();
      });
  });

  it('should successfully train one instance of all algorithms in classifierList, for this problemType', function() {

  });

  it('should have acceptably low error rates for each algorithm', function() {
    // TODO: probably break this out into separate tests, one for each algo. that way it will be easier to find which one failed.
  });

  



});
