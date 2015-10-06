var isFirstMessage = true;
var heardKillMessage = false;
process.on('message', function(message) {
  if(isFirstMessage) {
    isFirstMessage = false;
    var startTime = Date.now();
    var path = require('path');
    var fs = require('fs');
    var brain = require('brain');

    // CLEAN: fs.readFile should be an asynch operation, so saving it's results into trainingData doesn't make any sense. 
    fs.readFile(message.pathToData, {encoding: 'utf8'}, function(err, data) {
      if(err) {
        console.error(err);
      } else {
        var mostRecentPostcardHome = Date.now();

        // FUTURE: give the ability to log out more frequently (within a training iteration) for datasets that are large and take forever to train
        var trainingIterationCallback = function(errObj) {
          var timeSinceLastMessage = (Date.now() - mostRecentPostcardHome) / 1000 //this gives us the time in seconds
          // if(timeSinceLastMessage > 30 || errObj.iterations % 10 === 0) {
            var messageObj = {
              type: 'midTrainingCheckIn',
              brainID: message.brainID,
              iterations: errObj.iterations,
              errorRate: errObj.error,
              net: net.toJSON(),
              trainingParams: message,
              trainingTime: Date.now() - startTime
            };

            // FUTURE: add in a check to see how much we're decreasing the error rate by on each iteration, and kill the net if it's no longer decreasing the error rate on a useful trajectory

            // console.log('trainingTime:',messageObj.trainingTime,'maxTime:',message.maxTrainingTime,'iterations:',messageObj.iterations,'maxIterations:',message.maxTrainingIterations);
            // see if we've exceeded our alotted trainingTime, while also meeting our minimum training threshold:
            if(messageObj.trainingTime/1000 >= message.maxTrainingTime || messageObj.iterations >= message.maxTrainingIterations) {
              if(messageObj.trainingTime / 1000 >= message.minTrainingTime) {
                messageObj.type = 'finishedTraining';
              }
            }
            
            process.send(messageObj);
          // }
        }

        message.trainingObj.callback = trainingIterationCallback;
        message.trainingObj.callbackPeriod = 2;

        var rows = data.split('\n');
        for (var i = 0; i < rows.length; i++) {
          rows[i] = JSON.parse(rows[i]);
        }

        if(message.extendedTraining === true) {
          var net = new brain.NeuralNetwork();
          net.fromJSON( JSON.parse(message.trainingBestAsJSON));
        }

        // this entire process of training the net happens synchronously. yeah, i know, it's weird dealing with synchronous code inside node.js :)
        var net = new brain.NeuralNetwork(message.trainingObj);
        var trainingResults = net.train(rows, message.trainingObj);

        var trainingTime = Date.now() - startTime;
        console.log("trained in " + trainingResults.iterations + " iterations with error: "
          + trainingResults.error + "taking", trainingTime / 1000,"seconds.");

        returnData = trainingResults;
        returnData.net = net.toJSON();
        returnData.errorRate = trainingResults.error;
        returnData.trainingTime = trainingTime;
        returnData.type = 'finishedTraining';
        returnData.brainID = message.brainID;

        process.send(returnData);
      }
    });
  } else if (message.type === 'killProcess') {
    console.log('heard a kill message');
    heardKillMessage = true;
  }

});
