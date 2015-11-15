var expect = require('chai').expect;
var mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;

module.exports = function() {
  
  describe('splitting the formatted dataset', function() {

    it('should create a new validation split when we do not have one already', function() {
      var fileStats = fs.statSync(path.join(rTest.dataLocation, 'dfValidationIndicesrossmantest.pkl'));
      expect( new Date(fileStats.ctime) ).to.be.above(rTest.startTime);
    });


    it('should copy the validation dataset to the valdiation folder in predictions', function(done) {
      fs.readFile(path.join(rTest.rTestPredictionsLocation, 'validation','validationData.npz'), function(err, data) {
        console.log('err',err);
        expect(err).to.be.null;
        done();
      });
    });


    it('should copy the validation IDs and Y to the valdiation folder in predictions', function(done) {
      fs.readFile(path.join(rTest.rTestPredictionsLocation, 'validation','validationIDsAndY.csv'), function(err, data) {
        console.log('err',err);
        expect(err).to.be.null;

        console.log('data.length', data.length);

        expect(data.length).to.equal(50925);
        done();
      });
    });


    it('should use the existing validation split if it already exists', function() {
      var secondStartTime = Date.now();
      // TODO: try running the test again, and 
      execSync('node ppLib.js ' 
        + path.join(rTest.dataLocation,'tinyTrain.csv') 
        + ' --kagglePredict ' + path.join(rTest.dataLocation,'test.csv') 
        + ' --join ' + path.join(rTest.dataLocation, 'store.csv') 
        + ' --dfOutputFolder ' + path.join(rTest.testFileLocation, 'dfTestResults')
        + ' --predictionsFolder ' + path.join(rTest.testFileLocation, 'rTestPredictions')
        + ' --ensemblerOutputFolder ' + rTest.testFileLocation
        + ' --bestClassifiersFolder ' + path.join(rTest.testFileLocation, 'bestClassifiersTest')
        + ' --splitDataTest true'
      );
      
      var fileStats = fs.statSync(path.join(rTest.dataLocation, 'dfValidationIndicesrossmantest.pkl'));
      expect( new Date(fileStats.ctime) ).to.be.below(secondStartTime);

    });

  });
  
}

