process.on('message', function(message) {
  var startTime = Date.now();
  var path = require('path');
  var fs = require('fs');
  var brain = require('brain');

  var trainingData = fs.readFile(message.body.pathToData, {encoding: 'utf8'}, function(err, data) {
    if(err) {
      console.error(err);
    } else {
      var rows = data.split('\n');
      for (var i = 0; i < rows.length; i++) {
        rows[i] = JSON.parse(rows[i]);
      }

      var net = new brain.NeuralNetwork(message.body.trainingObj);
      var trainingResults = net.train(rows, message.body.trainingObj);

      var trainingTime = Date.now() - startTime;
      console.log("trained in " + trainingResults.iterations + " iterations with error: "
        + trainingResults.error + "taking", trainingTime / 1000,"seconds.");

      returnData = trainingResults;
      returnData.net = net.toJSON();
      returnData.trainingTime = trainingTime;
      returnData.type = 'finishedTraining';

      process.send(returnData);
    }
  });

});
