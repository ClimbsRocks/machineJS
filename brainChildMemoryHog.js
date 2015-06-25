process.on('message', function(message) {
  var startTime = Date.now();
  var path = require('path');
  var fs = require('fs');
  var brain = require('brain');

  var trainingData = fs.readFile(message.pathToData, {encoding: 'utf8'}, function(err, data) {
    if(err) {
      console.error(err);
    } else {
      var mostRecentPostcardHome = Date.now();

      var trainingIterationCallback = function(errObj) {
        console.log('inside training callback!');
        var timeSinceLastMessage = (Date.now() - mostRecentPostcardHome) / 1000 //this gives us the time in seconds
        // if(timeSinceLastMessage > 30 || errObj.iterations % 10 === 0) {
          var messageObj = {
            type: 'midTrainingCheckIn',
            brainID: message.brainID,
            iterations: errObj.iterations,
            errorRate: errObj.error,
            net: net.toJSON(),
            trainingParams: message
          };
          process.send(messageObj);
        // }
      }

      message.trainingObj.callback = trainingIterationCallback;
      message.trainingObj.callbackPeriod = 10;

      var rows = data.split('\n');
      for (var i = 0; i < rows.length; i++) {
        rows[i] = JSON.parse(rows[i]);
      }

      var net = new brain.NeuralNetwork(message.trainingObj);
      var trainingResults = net.train(rows, message.trainingObj);

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
