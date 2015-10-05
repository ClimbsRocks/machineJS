var path = require('path');
var nnLocation = path.dirname(__filename);
var nn = global.neuralNetwork;
var argv = global.argv;


module.exports = {
  createParamsToTest: function () {
    var allParamsToTest = [];
    // TODO: double this and have it for a variety of trainingRates. 
  // ADVANCED: figure out some way of having fewer than 1 times the number of features as the node for each hidden layer. 
    // e.g., DilMil where we pruned out any feature that wasn't present in at least 1% of the dataset. 
      // technically, I grouped all those features together into something like "column5RareFeature = 1"
    var layersArray = [1,2,3,6,10];
    var nodesArray = [1,2,5,10,50,100];

    function createOneParamArray(numLayers,numNodes) {
      var outputArr = [];
      for (var i = 0; i < numLayers; i++) {
        outputArr.push(numNodes * nn.dataSummary.numFeatures); //multiply this by the number of features. 
      }
      return outputArr;
    }

  // creates nodesArray.length nets for each item in layersArray
    for (var i = 0; i < layersArray.length; i++) {
      // create nets with up to nodesArray[i] * the number of features in the dataset
      for (var j = 0; j < nodesArray.length; j++) {
        allParamsToTest.push(createOneParamArray(layersArray[i],nodesArray[j]));
      }
    }
    numOfNetsToTest = allParamsToTest.length;
    // if this is dev or devKaggle, we only want to test the largest and smallest nets (2 total)
    if(argv.dev || argv.devKaggle) {
      var tempParamsToTest = [];
      tempParamsToTest.push(allParamsToTest.shift());
      tempParamsToTest.push(allParamsToTest.pop());
      allParamsToTest = tempParamsToTest;
    }
    console.log('allParamsToTest:',allParamsToTest);
    return allParamsToTest;
  },

  makeTrainingObj: require('./utils/makeTrainingObj.js'),

  setGlobalVars: require('./utils/setGlobalVars.js'),

  bestNetChecker: require('./utils/bestNetChecker.js'),


  // This function is broken at the moment, and is not a high priority to fix. 
  testOutput: function(net) {

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
  }

}
