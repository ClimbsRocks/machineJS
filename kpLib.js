var Parallel = require('paralleljs');
var Worker = require('webworker-threads').Worker;
var Threads= require('webworker-threads');
var fs = require('fs');
var brain = require('brain');
var path = require('path');
var byline = require('byline');
var Q = require('q');
var Promise = require('bluebird');
var numCPUs  = require('os').cpus().length;

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
    console.log('trainingData.length:',trainingData.length);
    // Theoretically, this could be bad for short-term memory, since it will end up holding a large chunk of an enormous object in memory since it will not be able to write to the file as quickly as it's able to read from memory. 
    // However, we'll probably be reading this directly from a file, so i'm not worried about this long-term, since we'll just be piping. 
    // TODO: investigate using the drain event to figure out when to write more data to the stream. 
    // This writes larger chunks of data to the writeStream at a time, which signgificantly improved performance over writing each line and each newline character individually.
    // We are open to pull requests if anyone wants to optimize this further. 
    for(var i = 0; i < trainingData.length; i+=10) {
      var writeString = '';
      for(var j = 0; j < 10; j++) {
        if(i + j < trainingData.length) {
          writeString += JSON.stringify(trainingData[i + j]) + '\n';
          // TODO: give the user the option of keeping the data in memory. Since this is passed around by reference, we're actually overwriting the original data. This is low priority. 
          trainingData[i + j] = null;          
        }
      }
      writeStream.write(writeString);
      writeString = '';

      // now delete our trainingData by overwriting it with null. I'm not sure why I nested it within a setTimeout. I don't think that's working properly anyways. 
    }
    // writeStream.write(JSON.stringify(null));
    console.log('finished writing all the data to the stream itself');
    writeStream.on('drain', function() {
      console.log('heard the stream is drained after our for loop');
      writeStream.end();
    })
    writeStream.on('finish', function() {
      // BUG: our parallel processes appeared oddly in lockstep with each other- they al went through iteration 1, then they all went through iteration 2, then they all went through iteration 3, rather than each iterating through the code with it's own iteration counts divorced from all other processes. 
      // Hypothesis: since they're all reading from the same file, that file is likely I/O blocking. 
      // TODO: copy and paste the file 7 times, just adding a new number at the end of each name. 
      // TODO: refactor to use a sqlite database that allows streaming and multiple connections at once (and reads line by line?!)
      console.log('finished writing the data to a file');
      trainingData = null; //make sure to no longer point any variables to our trainingData, in case any still exists. 

      var readStream = fs.createReadStream('inputData.txt', {encoding: 'utf8'});
      readStream.pause();
      readStream.setMaxListeners(0);
      for (var i = 0; i < numCPUs; i++) {
        (function(num) {
          // We are making our files 1-indexed (inpudData1.txt - inputData8.txt). 
          var writeStream = fs.createWriteStream('inputData' + (num + 1) + '.txt');
          readStream.pipe(writeStream);
        })(i); //since streams are an asynch operation, we're making sure we store the current value of i in a closure. 
          
      }
      setTimeout(function() {
        readStream.resume();
      },1000); //just to be super extra cautious, wait a full second to make sure all of our writable streams are ready to go. 
      // TODO: we could create a new readable stream for each new writeable stream. but that might be blocking?


      // In this scope, end only fires once when everything is done reading from the readable stream. 
      // TODO: move to inside IIFE with a counter, or verify that we actually have all the rows in each file
      readStream.on('end', function() {
        console.log('heard an end to the piping readable stream');
        multipleNetAlgo();
      });


      // TODO: only invoke this once we've heard 8 finish events. 
    });


    // var writeCount = 0;
    // var intervalID = setInterval(function() {
    //   // TODO: pass in writeCount as a param to this function
    //   // TODO: delete the item at this position (set it equalto null);

    //   if(writeCount++ === trainingData.length -1) {
    //     clearInterval(intervalID);
    //     trainingData = null;
    //     console.log('finished writing the data to a file');
    //     writeStream.end();
    //     multipleNetAlgo();
    //   } else {
    //     writeStream.write(JSON.stringify(trainingData[writeCount]));
    //     writeStream.write('\n');
    //     // now delete our trainingData by overwriting it with null. I'm not sure why I nested it within a setTimeout. I don't think that's working properly anyways. 
    //     setTimeout(function() {
    //       trainingData[writeCount] = null;
    //     },1);
    //   }
    // },1);




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

  // console.log('trainingObj',allParamComboArr[0].trainingObj);
  var child_process = require('child_process'); //this is node's built in module for creating new processes. 
  // console.log('numCPUs:',numCPUs);

  // create a new child_process for all but one cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {
    var child = child_process.fork('./brainChild',{cwd: '/Users/preston/ghLocal/machineLearningWork/kpComplete'});
    child.send(allParamComboArr[i]);
    child.on('message', function(message) {
      console.log('parent received a message from its child:');
      // TODO: start a new child process after doing some logic
      // TODO: send training data back to the parent on each iteration (ideally, every 100 iterations or every 10 minutes)
      // TODO: have some way of timeboxing each experiment??
    });
  }

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
  for(var i = numCPUs; i > 0; i--) {

    var hlArray = [];
    for (var j = 0; j < i; j++) {
      hlArray.push(10);
    }

    var trainingObj = {
      errorThresh: 0.052,  // error threshold to reach
      iterations: 1000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 1,       // number of iterations between logging
      learningRate: 0.6    // learning rate
    };

    // TODO: make sure this path works always. Probably just capture the path where we write the file to (and log that for our user so they know where to look to delete it), and pass that through as a variable. 
    var currentPath = path.join(__dirname, '../inputData' + i + '.txt');

    allParamComboArr.push({hiddenLayers: hlArray, trainingObj: trainingObj, pathToData: currentPath});
  }

  parallelNets(allParamComboArr);
};
