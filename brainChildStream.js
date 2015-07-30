var chunkedTrainingData = [];
var totalRowsPassedThisIteration = 0;
var globalMessage;
var parentTime;

var passRowsIntoTrainingStream = function() {
  // console.log(chunkedTrainingData.length);  
  for (var i = 0; i < chunkedTrainingData.length; i++) {
    trainStream.write(chunkedTrainingData.pop());
    // chunkedTrainingData.pop();
    totalRowsPassedThisIteration++;
  }
  if (totalRowsPassedThisIteration >= globalMessage.body.totalRows - 1) {
    console.log('wrote all the data!');
    console.log('totalRowsPassedThisIteration:',totalRowsPassedThisIteration);
    trainStream.write(null);
  } else {
    console.log('totalRowsPassedThisIteration:',totalRowsPassedThisIteration,'globalMessage.body.totalRows:',globalMessage.body.totalRows);
    var messageObj = {
      type: 'getNewData',
      rowsSoFar: totalRowsPassedThisIteration
    };
    console.log('this iteration took:',(Date.now() - parentTime) ,'seconds');

    parentTime = Date.now();
    process.send(messageObj);
    
  }
}

var startNet = function() {

  // we are intentionally putting all variables inside this function into the global scope
  brain = require('brain');
  net = new brain.NeuralNetwork(); 


  trainStream = net.createTrainStream({
    errorThresh: globalMessage.body.trainingObj.errorThresh,  // error threshold to reach
    iterations: globalMessage.body.trainingObj.iterations,    // maximum training iterations
    log: globalMessage.body.trainingObj.log,          // console.log() progress periodically
    logPeriod: globalMessage.body.trainingObj.logPeriod,       // number of iterations between logging
    learningRate: globalMessage.body.trainingObj.learningRate,   // learning rate
    
    // Write training data to the stream. Called on each training iteration.
    // Streams happen asynchronously. 
    floodCallback: function() {
      console.log('finished an iteration');
      passRowsIntoTrainingStream();
    },

   // Called when the network is done training.
   doneTrainingCallback: function(obj) {
    trainingTime = Date.now() - startTime;
    console.log("trained in " + obj.iterations + " iterations with error: "
      + obj.error + "taking", trainingTime / 1000,"seconds.");
    // TODO: invoke bestNetChecker here. Well, we can't, because this thread is actually in a different memory space. 
    // TODO: write the fully trained net to a file. Save a path to that file. Make it in the same location as our inputData.txt file. 
    returnData = obj;
    // TODO: add our net to returnData
    returnData.net = net.toJSON();
    returnData.trainingTime = trainingTime;
    returnData.type = 'finishedTraining';

    process.send(obj);
    // self.close();

    // TODO: write net to file
    // TODO: self.close after some time
      // Post MVP: set that time to be dependent on the size of the net
    }
  });
}


var startFirstBrain = function(message) {

  var startTime = Date.now();
  var path = require('path');
  var fs = require('fs');
  var brain = require('brain');
  console.log('inside a child_process');
  var stream = require('stream');

  // console.log('items in process.env.memorizedTrainingData:',process.env.memorizedTrainingData.length);
  // for(var i = 0; i < process.env.memorizedTrainingData.length; i++) {
  //   console.log('i:',i,'process.env.memorizedTrainingData[i]:',process.env.memorizedTrainingData[i]);
  // }

  var net = new brain.NeuralNetwork(); 

  var currentPath = message.body.pathToData;

  // create all the right streams to start an iteration of our brain. 
  var startBrain = function() {
    var readStream = fs.createReadStream(currentPath, {encoding:'utf8'});
    // setting objectMode: true means we can pass JS objects through to the train stream, rather than having to pass them as strings or buffers as we normally would have to. 
    var transformStream = new stream.Transform({objectMode: true});

    // This variable accounts for what happens when the incoming buffer ends in the middle of a line
    transformStream._partialLineData = '';
    var readStreamFinished = false;

    // transforms a giant chunk of buffer object into individual JS objects, which we pass one at at time into our brain training stream in objectMode
    var transformStart = Date.now();
    transformStream._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;

      var rows = data.split('\n');
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      for(var i = 0; i < rows.length; i++) {
        // console.log('rows[i] inside brainChild transformStream:',JSON.parse(rows[i]));
        parsedRow = JSON.parse(rows[i]);
        if(!parsedRow.testingDataSet) {
          this.push(parsedRow);
        }
      }
      // TODO: check this out in conjunction with the readStream.on('end') note below. 
      // if(readStreamFinished) {
      //   transformStream._flush();
      //   trainStream.write(null);
      // }

      done();
    };

    transformStream._flush = function (done) {
      if (this._partialLineData) {
        this.push(JSON.parse(this._partialLineData));
      }
      this._partialLineData = '';
      done();
    };

    // pipe our data from the file, into our transformStream, which turns it into a tidy stream of JS objects, into our trainStream (which we must leave open for the next iteration).
    readStream.pipe(transformStream).pipe(trainStream, {end: false});

    // TODO: make sure that we've actually written all of our data to the trainStream. I have a feeling the readStream end emits before our transformStream has had a chance to process through everything. 
    readStream.on('end', function() {
      // readStreamFinished = true;
      console.log('transform Read Time:', Date.now() - transformStart);
      trainStream.write(null);  
    });

  };

  var trainStream = net.createTrainStream({
    errorThresh: message.body.trainingObj.errorThresh,  // error threshold to reach
    iterations: message.body.trainingObj.iterations,    // maximum training iterations
    log: message.body.trainingObj.log,          // console.log() progress periodically
    logPeriod: message.body.trainingObj.logPeriod,       // number of iterations between logging
    learningRate: message.body.trainingObj.learningRate,   // learning rate
    
    // Write training data to the stream. Called on each training iteration.
    // Streams happen asynchronously. 
    floodCallback: function() {
      // console.log('finished an iteration');
      startBrain();
    },

   // Called when the network is done training.
   doneTrainingCallback: function(obj) {
    var trainingTime = Date.now() - startTime;
    console.log("trained in " + obj.iterations + " iterations with error: "
      + obj.error + "taking", trainingTime / 1000,"seconds.");
    // TODO: invoke bestNetChecker here. Well, we can't, because this thread is actually in a different memory space. 
    // TODO: write the fully trained net to a file. Save a path to that file. Make it in the same location as our inputData.txt file. 
    returnData = obj;
    // TODO: add our net to returnData
    returnData.net = net.toJSON();
    returnData.trainingTime = trainingTime;
    returnData.type = 'finishedTraining';

    process.send(obj);
    // self.close();

    // TODO: write net to file
    // TODO: self.close after some time
      // Post MVP: set that time to be dependent on the size of the net
    }
  });

  startBrain();
};


process.on('message', function(message) {
  if(message.type === 'startBrain') {
    globalMessage = message;
    // startNet();
    // passRowsIntoTrainingStream();
    startFirstBrain(message);
  } else /*if (message.type === 'newDataRows')*/ {
    // console.log('message with new data:', message);
    // console.log('heard a new message from parent');
    // console.log('message.length:',message.length);
    chunkedTrainingData = chunkedTrainingData.concat(message);
    passRowsIntoTrainingStream();
  }
});