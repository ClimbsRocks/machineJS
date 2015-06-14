var Parallel = require('paralleljs');
var Worker = require('webworker-threads').Worker;
var Threads= require('webworker-threads');
var fs = require('fs');
var brain = require('brain');
var path = require('path');
var byline = require('byline');
var Q = require('q');
var Promise = require('bluebird');

// refactor to use webworker threads
// send in parameters as a message
  // using bind is a backup here
// do all the computing
// send the results out as a message
// then, on a setTimeout nested within sending back those results, close the thread. 
// this is so much easier than what i was trying to do. 
// because we're reading all the data from a file. that simplifies this process so much. 

var bestNet = {
  jsonBackup: '',
  errorRate: 1,
  trainingTime: Infinity
};

module.exports = {
  train: function(trainingData) {
    // TODO: make this more secure. Ideally write to an encrypted database or sqlite file that we could then delete the whole file. 
    // open a writeStream
    var writeStream = fs.createWriteStream('inputData.txt',{encoding: 'utf8'});

    // brain.js's streaming interface expects to get a single item in at a time. 
    // to do this, we are saving each object in trainingData into a new row
    // and then later on, reading the file one row at a time
    // writing to the file itself is an asynch operation
    // and that asynch operation can take some time since it's an I/O call
    // we'll stagger them by 1 millisecond to not overwhelm the writeStream (though now that I think about it, writeStreams are designed to be overwhelmed, right?)
    // This is definitely not the most elegant implementation. But it works. 
    // We're super open to pull requests for a better way to do this :)
    var writeCount = 0;
    var intervalID = setInterval(function() {
      // TODO: pass in writeCount as a param to this function
      // TODO: delete the item at this position (set it equalto null);

      if(writeCount++ === trainingData.length -1) {
        clearInterval(intervalID);
        trainingData = null;
        console.log('finished writing the data to a file');
        writeStream.end();
        multipleNetAlgo();
      } else {
        writeStream.write(JSON.stringify(trainingData[writeCount]));
        writeStream.write('\n');
        // now delete our trainingData by overwriting it with null. I'm not sure why I nested it within a setTimeout. I don't think that's working properly anyways. 
        setTimeout(function() {
          trainingData[writeCount] = null;
        },1);
      }
    },1);
    //   // TODO: Write to a memcached or sqlite DB. sqlite might take it out of memory entirely, which would be nice! Then, once we've written to that DB, delete the object. Or at least overwrite it's properties to be null. 
    //   // Yeah, overwrite the data stored at each property to just be an empty string after we've saved to a db. Later we can work on deleting the object itself by deleting all references to it, which will kick in JS's auto garbage collection.       

    // return the net itself
    // var net = kpComplete.train(trainingData); should be something they can type in. 
    // and then we'd return the fully trained net. 
    // because we can get a net from JSON. so let's do that and then return it. 
    // TODO: investigate if we need to give them a callback. does this become asynch with paralleljs?
    // return net.fromJSON(bestNet.jsonBackup);
    // TODO: return asynchronously. Maybe promisify multipleNetAlgo??
  }
};


var parallelNets = function(allParamComboArr) {

  console.log('trainingObj',allParamComboArr[0].trainingObj);


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

  var thread = Threads.create();
  thread.eval(parallelFunc);
  thread.eval('parallelFunc()')

  thread.onmessage = function(event) {
    console.log('heard a message from our worker!', event);
    // TODO: bestNetChecker, etc. 
    // keep track of how many cores we have available. As soon as one opens up (here!), we should start a new training
  };
  // worker.postMessage(allParamComboArr[0].trainingObj);

};


var bestNetChecker = function(trainingResults,trainedNet) {
  console.log('checking if this is the best net');
  if(trainingResults.error < bestNet.errorRate) {
    //TODO: make this the best net
    bestNet.jsonBackup = trainedNet.toJSON();
    bestNet.errorRate = trainingResults.error;
  }
  //check against our global bestNet
  console.log('bestNet now is:',bestNet);
  // TODO: build in logic to see if we've trained all the nets
  // TODO: more logging, perhaps? Let the user know once every 5 nets that something's going on?
  // TODO: write each new bestNet to a file. 
    // TODO: figure out how to not fail if the user stops the program mid-file-write
      // I'm thinking we write to a backup file first, then overwrite the main file, or rename the backup file to be the same name as the main file. 
};

var multipleNetAlgo = function() {
  // TODO: 
    // nest everything inside a recursive function
    // that function will recurse until we've covered the entire space and converged on an answer
    // each iteration will create a new set of params we want to test against
    // we will then invoke parallelNets, which will take in an array of params we want to try, and return a promise. 
    // once we get the promise back, we'll invoke the recursive function again
    // that recursive function will then perform some logic, find a new set of params to train against, and then invoke parallelNets...
    // Yeah, Katrina for sure gets the challenging part. 
    // That'll be a ton of fun for her :)

  //create logic for training as many nets as we need. 
  // TODO: refactor this to use map instead
  var allParamComboArr = [];
  for(var i = 1; i > 0; i--) {

    var hlArray = [];
    for (var j = 0; j < 8; j++) {
      hlArray.push(10);
    }

    var trainingObj = {
      errorThresh: 0.05,  // error threshold to reach
      iterations: 1000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 5,       // number of iterations between logging
      learningRate: 0.6    // learning rate
    };

    // TODO: make sure this path works always. Probably just capture the path where we write the file to (and log that for our user so they know where to look to delete it), and pass that through as a variable. 
    var currentPath = path.join(__dirname, '../inputData.txt');

    allParamComboArr.push({hiddenLayers: hlArray, trainingObj: trainingObj, pathToData: currentPath});
  }
  console.log('allParamComboArr:',allParamComboArr);

  // // //copying here to test if it's parallelization issues or brain issues:
  // var net = new brain.NeuralNetwork({
  //   errorThresh: 0.05,  // error threshold to reach
  //   iterations: 100,    // maximum training iterations
  //   log: true,          // console.log() progress periodically
  //   logPeriod: 1,       // number of iterations between logging
  //   learningRate: 0.6   // learning rate
  // }); 

  // var trainStream = net.createTrainStream({
  //   errorThresh: 0.05,  // error threshold to reach
  //   iterations: 100,    // maximum training iterations
  //   log: true,          // console.log() progress periodically
  //   logPeriod: 1,       // number of iterations between logging
  //   learningRate: 0.6,   // learning rate
  //   /**
  //    * Write training data to the stream. Called on each training iteration.
  //    */
  //   floodCallback: function() {
  //     console.log('inside flood callback');
  //     var currentPath = path.join(__dirname, '../inputData.txt');
  //     var newStream = fs.createReadStream(currentPath);
  //     newStream = byline(newStream);
  //     var numOfItems = 0;
  //     newStream.on('data', function(data) {
  //       trainStream.write(JSON.parse(data));
  //       numOfItems++;
  //     });
  //     // newStream.pipe(trainStream, {end: false});
  //     newStream.on('end', function() {
  //       // console.log('heard an end!');
  //       // setTimeout(function() {
  //       //   console.log('writing null to trainStream after 3 seconds');
  //         trainStream.write(null);  
  //         console.log('numOfItems',numOfItems);
  //       // }, 3000);
  //     });
  //     // console.log('end of floodCallback (synchronously)');
  //   },

  //   /**
  //    * Called when the network is done training.
  //    */
  //   doneTrainingCallback: function(obj) {
  //     console.log("trained in " + obj.iterations + " iterations with error: "
  //                 + obj.error);
  //   }
  // });

  // var currentPath = path.join(__dirname, '../inputData.txt');
  // var readStream = fs.createReadStream(currentPath, {encoding:'utf8'});
  // readStream = byline(readStream);
  // var numOfItems = 0;
  // readStream.on('data', function(data) {
  //   // console.log('one line of data in readStream is:',JSON.parse(data));
  //   trainStream.write(JSON.parse(data));
  //   numOfItems++;
  // });
  // // readStream.pipe(trainStream, {end: false});
  // readStream.on('end', function() {
  //   // console.log('ended reading the stream');
  //   // setTimeout(function() {
  //   //   console.log('writing null to trainStream after a 3 second delay');
  //   console.log('numOfItems',numOfItems);
  //     trainStream.write(null);
  //   // },3000);
  // });
  // console.log('happening asynch after createReadStream');


  parallelNets(allParamComboArr);
};
