process.on('message', function(message) {
  var startTime = Date.now();
  var path = require('path');
  var fs = require('fs');
  var brain = require('brain');
  console.log('inside a child_process');

  var trainingData = fs.readFile(message.body.pathToData, {encoding: 'utf8'}, function(err, data) {
    if(err) {
      console.error(err);
    } else {
      console.log('got the data!');
      var rows = data.split('\n');
      console.log('rows.length:',rows.length);
      for (var i = 0; i < rows.length; i++) {
        rows[i] = JSON.parse(rows[i]);
      }

      console.log('finished parsing all the rows');

      console.log('message.body.trainingObj', message.body.trainingObj);
      var net = new brain.NeuralNetwork(message.body.trainingObj);
      var trainingResults = net.train(rows, message.body.trainingObj);

      var trainingTime = Date.now() - startTime;
      console.log("trained in " + trainingResults.iterations + " iterations with error: "
        + trainingResults.error + "taking", trainingTime / 1000,"seconds.");
      // TODO: invoke bestNetChecker here. Well, we can't, because this thread is actually in a different memory space. 
      // TODO: write the fully trained net to a file. Save a path to that file. Make it in the same location as our inputData.txt file. 
      returnData = trainingResults;
      // TODO: add our net to returnData
      returnData.net = net.toJSON();
      returnData.trainingTime = trainingTime;
      returnData.type = 'finishedTraining';

      process.send(returnData);
    }
  });

});
