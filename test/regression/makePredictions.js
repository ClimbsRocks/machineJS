var expect = require('chai').expect;
var mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var rTest = global.rTest;
var csv = require('csv');


module.exports = function() {

  describe('the predictions for each classifier', function() {

    // If you have added a new classifier, and it works for regressions, add it here!
    // ******************************************************************************
    var expectedMinimumTrainingScores = {
      // clRfGini: 0.955,
      // clXGBoost: 0.87,
      clAdaBoost: 0.535
    };

    var expectedMinimumValidationScores = {
      clRfGini: 0.845,
      clXGBoost: 0.74,
      clAdaBoost: 0.525
    };
    // ******************************************************************************

 
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
            expect(validationData.length).to.be.within(51000 - 300, 51000 + 300);

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

  });

  
}

