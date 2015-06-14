process.on('message', function(message) {
  var path = require('path');
  var fs = require('fs');
  // TODO: navigate to brain.js inside of our own node module. once we turn this into a module, of course. 
  var brain = require('brain');
  var byline = require('byline');
  // var Promise = require(path.join(__dirname + '../../../bluebird/js/main/bluebird.js'));
  console.log('inside a child_process');

  var net = new brain.NeuralNetwork({
    errorThresh: 0.05,  // error threshold to reach
    iterations: 100,    // maximum training iterations
    log: true,          // console.log() progress periodically
    logPeriod: 1,       // number of iterations between logging
    learningRate: 0.6   // learning rate
  }); 

  var trainStream = net.createTrainStream({
    errorThresh: 0.05,  // error threshold to reach
    iterations: 100,    // maximum training iterations
    log: true,          // console.log() progress periodically
    logPeriod: 1,       // number of iterations between logging
    learningRate: 0.6,   // learning rate
    /**
     * Write training data to the stream. Called on each training iteration.
     */

    //Streams happen asynchronously. 
    floodCallback: function() {
      // TODO: Investigate this if there are bugs
      var currentPath = message.pathToData;
      var newStream = fs.createReadStream(currentPath, {encoding:'utf8'});
      newStream = byline(newStream);
      var numOfItems = 0;
      newStream.on('data', function(data) {
        trainStream.write(JSON.parse(data));
        numOfItems++;
      });
      newStream.on('end', function() {
        trainStream.write(null);  
      });
    },

    /**
     * Called when the network is done training.
     */
    doneTrainingCallback: function(obj) {
      console.log("trained in " + obj.iterations + " iterations with error: "
                  + obj.error);
      // TODO: invoke bestNetChecker here. Well, we can't, because this thread is actually in a different memory space. 
      // TODO: write the fully trained net to a file. Save a path to that file. Make it in the same location as our inputData.txt file. 
      returnData = obj;
      // TODO: add our net to returnData
      returnData.net = net;
      readyToReturn = true;

      postMessage(obj, net.toJSON());
      self.close();

      // TODO: send message (will this message include the JSON version of the net? probably)
      // TODO: write net to file
      // TODO: self.close after some time
        // Post MVP: set that time to be dependent on the size of the net
    }
  });
  
  console.log('heard message!');
  var currentPath = message.pathToData;
  console.log('currentPath:',currentPath);
  var readStream = fs.createReadStream(currentPath, {encoding:'utf8'});
  readStream = byline(readStream);
  var numOfItems = 0;
  readStream.on('data', function(data) {
    // console.log('one line of data in readStream is:',JSON.parse(data));
    trainStream.write(JSON.parse(data));
    numOfItems++;
  });
  // readStream.pipe(trainStream, {end: false});
  readStream.on('end', function() {
    // console.log('ended reading the stream');
    // setTimeout(function() {
    //   console.log('writing null to trainStream after a 3 second delay');
    console.log('numOfItems',numOfItems);
      trainStream.write(null);
    // },3000);
  });
  // TODO: run bestNetChecker

});