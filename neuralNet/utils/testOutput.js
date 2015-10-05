// This function is broken at the moment, and is not a high priority to fix. 

var fs = require('fs');
var nn = global.neuralNetwork;
var path = require('path');


// This function is broken at the moment, and is not a high priority to fix. 
module.exports= function(net) {

  var testSummary = {};
  for (var i = 0; i <= 100; i++) {
    testSummary[i] = {
      countOfPredictionsAtThisProbability: 0,
      observedValues: 0
    };
  }
  // right now we're just reading in the entire training set. 
  // TODO: test on only the held-back portion of the input data.
  // TODO: formattedData0.txt doesn't exist anymore. All it did was format things into an array. 
    // that probably wouldn't have worked once we moved to a true train and test dataset anyways. 
  var readStream = fs.createReadStream(path.join(nnLocation,'/formattedData0.txt'), {encoding: 'utf8'});
  readStream._partialLineData = '';

  readStream.on('data', function(data) {
    data = this._partialLineData + data;
    var rows = data.toString().split('\n');
    this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

    for (var j = 0; j < rows.length; j++) {
      var row = JSON.parse(rows[j]);
      if(row.testingDataSet) {
        var nnPrediction = Math.round(net.run(row.input).numericOutput * 100);
        testSummary[nnPrediction].countOfPredictionsAtThisProbability++;
        // TODO: make this work for categorical output too. right now it only works for numeric output. 
        testSummary[nnPrediction].observedValues += parseFloat(row.output.numericOutput, 10);
      }
    }
  });

  // TODO: turn this into a single error number, rather than the human-readable output below.
  readStream.on('end', function() {
    for(var key in testSummary) {
      console.log(key, 'count:', testSummary[key].countOfPredictionsAtThisProbability, 'rate:', Math.round(testSummary[key].observedValues / testSummary[key].countOfPredictionsAtThisProbability * 100) + '%');
    }
  });
};
