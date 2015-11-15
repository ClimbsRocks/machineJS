var expect = require('chai').expect;
var mocha = require('mocha');

module.exports = function() {

  describe('the logistics of making predictions with a trained algorithm', function() {

    // these are the tests that are relatively generic, and will be run for each algorithm:
    it('should copy the validation dataset to the folder holding our predictions',function() {

    });
    
    it('should write all predictions to a specific folder for this test.csv dataset',function() {

    });
    
    it('should make predictions on the test.csv dataset',function() {

    });
    
    it('should have only an ID and an Output column in our predictions file for each algorithm',function() {

    });
    
    it('should keep the name of the algorithm in the name of the predictions file',function() {

    });
    
    it('should keep the name of the training.csv dataset in the name of the predictions file',function() {
      // this way we can go through and ensemble together only predictions from a single training set to see if that particular bit of feature engineering is more effective than the others we've tried so far. 
    });

    it('should write the pretty ID and the pretty predictions header to the file', function() {

    });

    it('should write the training error rate and the validation error rate to the header row in the predictions file', function() {

    });


  });

  describe('the quality of predictions made by a trained algorithm', function() {
    it('should have an error rate below FILL_ME_IN for FILL_ME_IN algorithm for this dataset', function() {
      // get this by loading up the trained algorithms, then running them against the validation dataset, just to be sure
    });

  });

}

