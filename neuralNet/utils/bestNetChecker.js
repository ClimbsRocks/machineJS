var nn = global.neuralNetwork;
var fs = require('fs');
var mostRecentWrittenNet = Date.now();
var namesOfWrittenNets = [];


module.exports = function(trainingResults) {
  // console.log('checking if this is the best net:',trainingResults);
  // nn.bestNetObj.trainingErrorRate is an array of all the error rates it has had along the way. We want the most recent one. 
  if(trainingResults.errorRate < nn.bestNetObj.trainingErrorRate[nn.bestNetObj.trainingErrorRate.length -1]) {
    // console.log('trainingResults:',trainingResults);
    // console.log('trainingResults.net:',trainingResults.net);
    // make this the best net
    nn.bestNetObj.trainingBestAsJSON = JSON.stringify(trainingResults.net);
    // we will have many new bestNets on our first training round. This prevents us from having too many new files created
    // Admittedly, this is potentially still creating a new net every three seconds, which is a lot.
    // The risk we're running right now is simply that we lose three seconds worth of work. The worst case scenario is that we write the most recent net to file, and then 2.9 seconds later, we simultaneously get a new best net, don't write it to file, and then close out the server for some reason, forever losing that last net. This seems a small risk. 
    if(nn.completedNets > 0 || Date.now() - mostRecentWrittenNet > 3000 || trainingResults.type === 'finishedTraining') {
      var bestNetFileName = 'neuralNet/bestNet/bestNet' + Date.now() + '.txt';
      namesOfWrittenNets.push(bestNetFileName);
      fs.writeFile(bestNetFileName, nn.bestNetObj.trainingBestAsJSON, function() {
        // delete the previously written bestNet file(s), now that we have a new one written to disk successfully. 
        while(namesOfWrittenNets.length > 1) {
          fs.unlink(namesOfWrittenNets.shift());
        }
      });
      mostRecentWrittenNet = Date.now();
    }
    // TODO: grab the entire array
    nn.bestNetObj.trainingErrorRate = nn.neuralNetResults[trainingResults.brainID].trainingErrorRate;
    nn.bestNetObj.trainingBestTrainingTime = trainingResults.trainingTime;
    nn.bestNetObj.brainID = trainingResults.brainID;
    nn.bestNetObj.hiddenLayers = trainingResults.trainingParams.hiddenLayers;
  }
};
