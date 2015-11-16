var expect = require('chai').expect;
var mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var rTest = global.rTest;

module.exports = function() {
  
  describe('training and tuning algorithms', function() {

    it('should successfully train one instance of all algorithms in classifierList, for this problemType', function() {
      
      var classifierList = require(path.join(rTest.mjsLocation, 'pySetup', 'classifierList'));
      classifierList = Object.keys(classifierList.longDataSet);
      var trainedAlgos = fs.readdirSync(rTest.bestClassifiersTestLocation);

      function verifyAllClassifiersTrained() {
        var foundClassifiers = [];
        // for each classifier we expected to train:
        for( var i = 0; i < classifierList.length; i++ ) {
          var found = false;

          // compare it against the ones that finished:
          for( var j = 0; j < trainedAlgos.length; j++ ){ 
            if( trainedAlgos[j].indexOf( classifierList[i] ) !== -1 ) {
              foundClassifiers.push(classifierList[i]);
            }
          }
        }

        // if we have found all of them at the end, return true
        return foundClassifiers;
      }

      expect( verifyAllClassifiersTrained() ).to.deep.equal(classifierList);;
    });

    // it('should write each algorithm to a file in the correct directory', function() {

    // });

    // it('should name the trained algorithm file after the algorithm\'s name', function() {

    // });

    // it('should have acceptably low error rates for each algorithm', function() {
    //   // TODO: probably break this out into separate tests, one for each algo. that way it will be easier to find which one failed.
    // });


  });

}

