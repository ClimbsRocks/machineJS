var expect = require('chai').expect;
var mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var rTest = global.rTest;
var csv = require('csv');


module.exports = function() {

  describe('the predictions for each classifier', function() {

    // If you have added a new classifier, and it works for regressions, add it here!
    var expectedMinimumTrainingScores = {
      clRfGini: 0.955,
      clAdaBoost: 0.535,
      clXGBoost: 0.87
    };

    var expectedMinimumValidationScores = {
      clRfGini: 0.845,
      clAdaBoost: 0.525,
      clXGBoost: 0.74
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
            var predictionFileName;
            var validationData;
            var predictionsData;

            before(function(done) {
              var validationFiles = fs.readdirSync(path.join(rTest.rTestPredictionsLocation, 'validation'));
              var predictionsFiles = fs.readdirSync(rTest.rTestPredictionsLocation);


              for(var i = 0; i < validationFiles.length; i++) {
                if( validationFiles[i].indexOf(clName) !== -1 ) {
                  validationFileName = validationFiles[i];
                }
              }

              for(var i = 0; i < predictionsFiles.length; i++) {
                if( predictionsFiles[i].indexOf(clName) !== -1 ) {
                  predictionFileName = predictionsFiles[i];
                }
              }

              // read in both our predictions data and our validation data

              fs.readFile(path.join(rTest.rTestPredictionsLocation, 'validation', validationFileName), function(err, data) {
                if(err) {
                  console.error(err);
                  done();
                }
                csv.parse(data, function(err, output) {
                  if(err) {
                    console.error(err);
                  }
                  validationData = output;


                  fs.readFile(path.join(rTest.rTestPredictionsLocation, predictionFileName), function(err, data) {
                    if(err) {
                      console.error(err);
                      done();
                    }
                    csv.parse(data, function(err, output) {
                      if(err) {
                        console.error(err);
                      }
                      predictionsData = output;
                      done();
                    });
                  });


                });
              });

            });

            var errorRow;

            it('should have validation error and training error in the first row of the validationData', function() {
              errorRow = validationData.shift();
              // console.log(errorRow[0]);
              // console.log(errorRow[1]);
              expect(parseFloat(errorRow[0], 10)).to.be.a('number');
              expect(parseFloat(errorRow[1], 10)).to.be.a('number');
            });

            it('should have done at least as well as it has in the past', function() {
              console.log('\n');
              console.log('this classifier\'s expected Validation Error:', expectedMinimumValidationScores[clName], 'this classifier\'s observed Validation Error:', Math.round(errorRow[0] * 1000) / 1000);
              console.log('this classifier\'s expected Training Error:', expectedMinimumTrainingScores[clName], 'this classifier\'s observed Training Error:', Math.round(errorRow[1] * 1000) / 1000);
              console.log('\n');
              expect(errorRow[0]).to.be.above(expectedMinimumValidationScores[clName]);
              expect(errorRow[1]).to.be.above(expectedMinimumTrainingScores[clName]);
            });

            it('should have the pretty names for this dataset in the second row of the validationData', function() {
              var headerRow = validationData.shift();
              expect(headerRow[0].toLowerCase()).to.equal('id');
              expect(headerRow[1].toLowerCase()).to.equal('sales');
            });

            it('should make predictions against the validation data set', function() {
              expect(validationData.length).to.be.within(51000 - 200, 51000 + 200);

              var shortestRowLength = Infinity;
              for(var i = 0; i < validationData.length; i++) {
                if( validationData[i].length < shortestRowLength ) {
                  shortestRowLength = validationData[i].length;
                }
              }

              expect(shortestRowLength).to.equal(2);

            });

            it('should have the pretty names for this dataset in the first row of the predictionsData', function() {
              var headerRow = predictionsData.shift();
              expect(headerRow[0].toLowerCase()).to.equal('id');
              expect(headerRow[1].toLowerCase()).to.equal('sales');
            });

            it('should make predictions against the test data set', function() {
              expect(predictionsData.length).to.equal(41088)

              var shortestRowLength = Infinity;
              for(var i = 0; i < predictionsData.length; i++) {
                if( predictionsData[i].length < shortestRowLength ) {
                  shortestRowLength = predictionsData[i].length;
                }
              }

              expect(shortestRowLength).to.equal(2);

            });


          });

          after(function() {
            predictionsData = null;
            validationData = null;
          })

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

