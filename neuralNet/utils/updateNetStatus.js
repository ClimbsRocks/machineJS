var nn = global.neuralNetwork;

module.exports= updateNetStatus = function(message) {
  var id = message.brainID;
  nn.neuralNetResults[id].iterations = message.iterations;
  nn.neuralNetResults[id].trainingErrorRate.push(message.errorRate);
  nn.neuralNetResults[id].net = message.net;
};
