var expect = require('chai').expect;
var mocha = require('mocha');

describe('splitting the formatted dataset', function() {
  before(function(done) {
      global.testNamespace.mjsChildProcess.on('splitDatasets', function() {
        done();
      });
  });

  it('should create a new validation split when we do not have one already', function() {

  });

  it('should use the existing validation split if it already exists', function() {

  });



});
