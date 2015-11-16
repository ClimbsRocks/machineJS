var expect = require('chai').expect;
var mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var rTest = global.rTest;
var csv = require('csv');

var singleClassifierPredictions = require('./singleClassifierPredictions');


module.exports = function() {

  describe('the predictions for each classifier', function() {

    // If you have added a new classifier, and it works for regressions, add it here!
    var expectedMinimumTrainingScores = {
      clRfGini: 0.955,
      clAdaBoost: 0.535,
      clXGBoost: 0.895
    };

    var expectedMinimumValidationScores = {
      clRfGini: 0.845,
      clAdaBoost: 0.525,
      clXGBoost: 0.795
    };

    // var validationFiles;
    // var predictionsFiles;

    // before(function() {

    //   // validationFiles = fs.readdirSync(path.join(rTest.rTestPredictionsLocation, 'validation'));
    //   // predictionsFiles = fs.readdirSync(rTest.rTestPredictionsLocation);

    //   console.log('validationFiles',validationFiles);
    //   console.log('predictionsFiles',predictionsFiles);
    //   // runTestsForEachClassifier();

    // });

    // runTestsForEachClassifier = function() {
      // run the tests for each classifier we expect to have trained
      for( var clName in expectedMinimumTrainingScores ) {
        (function testSingleAlgo(clName) {

          describe('predictions for ' + clName, function() {

            var validationFileName;
            var csvData;

            before(function(done) {
              console.log('inside before block');
              console.log('clName',clName);
              var validationFiles = fs.readdirSync(path.join(rTest.rTestPredictionsLocation, 'validation'));
              var predictionsFiles = fs.readdirSync(rTest.rTestPredictionsLocation);


              for(var i = 0; i < validationFiles.length; i++) {
                if( validationFiles[i].indexOf(clName) !== -1 ) {
                  validationFileName = validationFiles[i];
                  console.log('validationFileName',validationFileName);
                }
              }

              console.log('after for loop');
              fs.readFile(path.join(rTest.rTestPredictionsLocation, 'validation', validationFileName), function(err, data) {
                if(err) {
                  console.error(err);
                  done();
                }
                console.log('read in the file');
                csv.parse(data, function(err, output) {
                  if(err) {
                    console.error(err);
                  }
                  csvData = output;
                  console.log(output.length);
                  done();
                });
              });

            });

            it('should have validation error and training error in the first row', function() {
              var errorRow = csvData.shift();
              console.log(errorRow[0]);
              console.log(errorRow[1]);
              expect(errorRow[0]).to.be.above(expectedMinimumValidationScores[clName]);
              expect(errorRow[1]).to.be.above(expectedMinimumTrainingScores[clName]);
            });

            it('should have the pretty names for this dataset in the second row', function() {
              var headerRow = csvData.shift();
              console.log(headerRow[0]);
              console.log(headerRow[1]);
              expect(headerRow[0].toLowerCase()).to.equal('id');
              expect(headerRow[1].toLowerCase()).to.equal('sales');
            });

            it('should have made predictions against the validation data set', function() {
              expect(csvData.length).to.be.within(51000 - 200, 51000 + 200);

              var shortestRowLength = Infinity;
              for(var i = 0; i < csvData.length; i++) {
                if( csvData[i].length < shortestRowLength ) {
                  shortestRowLength = csvData[i].length;
                }
              }

              expect(shortestRowLength).to.equal(2);

            });


          });

        })(clName);

      }
    // };


    /*
      1. read in the trained classifier
      2. run it against the validation data set?
      3. read in the predictions file 
      4. look for validation error rate and training error rate
      5. make sure we have a predictions file
      6. make sure the format of everything in the predictions file is what we would expect

    */
    // 

  });

  // describe('the logistics of making predictions with a trained algorithm', function() {

  //   // these are the tests that are relatively generic, and will be run for each algorithm:
    
  //   it('should write all predictions to a specific folder for this test.csv dataset',function() {

  //   });
    
  //   it('should make predictions on the test.csv dataset',function() {

  //   });
    
  //   it('should have only an ID and an Output column in our predictions file for each algorithm',function() {

  //   });
    
  //   it('should keep the name of the algorithm in the name of the predictions file',function() {

  //   });
    
  //   it('should keep the name of the training.csv dataset in the name of the predictions file',function() {
  //     // this way we can go through and ensemble together only predictions from a single training set to see if that particular bit of feature engineering is more effective than the others we've tried so far. 
  //   });

  //   it('should write the pretty ID and the pretty predictions header to the file', function() {

  //   });

  //   it('should write the training error rate and the validation error rate to the header row in the predictions file', function() {

  //   });


  // });

  // describe('the quality of predictions made by a trained algorithm', function() {
  //   it('should have an error rate below FILL_ME_IN for FILL_ME_IN algorithm for this dataset', function() {
  //     // get this by loading up the trained algorithms, then running them against the validation dataset, just to be sure
  //   });

  // });

}

