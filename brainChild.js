var parallelFunc = function(netPArams){
  console.log('it works now');
  var path = require('path');
  var fs = require('fs');
  console.log(path);
  // TODO: navigate to brain.js inside of our own node module. once we turn this into a module, of course. 
  var brain = require(path.join(__dirname + '../../../brain/lib/brain.js'));
  var byline = require(path.join(__dirname + '../../../byline/lib/byline.js'));
  // var Promise = require(path.join(__dirname + '../../../bluebird/js/main/bluebird.js'));
  console.log('inside a callback in our map threads');
  console.log('__dirname:',__dirname);
  console.log('joined __dirname:',path.join(__dirname + '../../../brain/lib/brain-0.6.0.js'));
  console.log('brain is:',brain);

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

    //I believe that streams happen asynchronously. 
    floodCallback: function() {
      console.log('inside flood callback');
      // TODO: Investigate this if there are bugs
      var currentPath = netParams.pathToData;
      var newStream = fs.createReadStream(currentPath);
      newStream = byline(newStream);
      var numOfItems = 0;
      newStream.on('data', function(data) {
        trainStream.write(JSON.parse(data));
        numOfItems++;
      });
      newStream.pipe(trainStream, {end: false});
      newStream.on('end', function() {
        console.log('heard an end!');
        // setTimeout(function() {
        //   console.log('writing null to trainStream after 3 seconds');
          trainStream.write(null);  
          console.log('numOfItems',numOfItems);
        // }, 3000);
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
  
  this.onmessage = function(data) {
    console.log('heard data!', data);
    var currentPath = netParams.pathToData;
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
    console.log('happening asynch after createReadStream');
    // TODO: run bestNetChecker
    setTimeout(function() {
      console.log('happened after 3 seconds');
    },3000);
  };

};