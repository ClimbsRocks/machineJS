var fs = require('fs');
var brain = require('brain');
var path = require('path');
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

    // This writes larger chunks of data to the writeStream at a time, which signgificantly improved performance over writing each line and each newline character individually.
    // We are open to pull requests if anyone wants to optimize this further. 
    for(var i = 0; i < trainingData.length; i+=10) {
      var writeString = '';
      for(var j = 0; j < 10; j++) {
        if(i + j < trainingData.length) {
          writeString += JSON.stringify(trainingData[i + j]) + '\n';
          // TODO: give the user the option of keeping the data in memory. Since this is passed around by reference, we're actually overwriting the original data. This is low priority. 
          // set all data equal to null to free up space in RAM. 
          trainingData[i + j] = null;          
        }
      }
      writeStream.write(writeString);
      writeString = '';
    }

    console.log('finished writing all the data to the stream itself');

    writeStream.on('drain', function() {
      writeStream.end();
    });

    writeStream.on('finish', function() {

      console.log('finished writing the data to a file');
      trainingData = null; //make sure to no longer point any variables to our trainingData, in case any still exists. 

      // Create multiple copies of the data; one for each child process
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

      // we have multiple writable streams receiving data from the same readable stream. As soon as that single readable stream finishes, we know we've written all the data that we need to all the files that we need. 
      readStream.on('end', function() {
        multipleNetAlgo();
      });

    });

    //   // TODO: Write to a memcached or sqlite DB. sqlite might take it out of memory entirely, which would be nice! Then, once we've written to that DB, delete the object. Or at least overwrite it's properties to be null. 
    //   // Yeah, overwrite the data stored at each property to just be an empty string after we've saved to a db. Later we can work on deleting the object itself by deleting all references to it, which will kick in JS's auto garbage collection.       

    // return the net itself
    // var net = kpComplete.train(trainingData); should be something they can type in. 
    // and then we'd return the fully trained net. 
    // because we can get a net from JSON. so let's do that and then return it. 
    // TODO: investigate if we need to give them a callback. Probably.
    // return net.fromJSON(bestNet.jsonBackup);
    // TODO: return asynchronously. Maybe promisify multipleNetAlgo??
  }
};


var parallelNets = function(allParamComboArr) {

  var child_process = require('child_process'); //this is node's built in module for creating new processes. 

  // create a new child_process for all but one of the cpus on this machine. 
  for (var i = 0; i < numCPUs; i++) {
    // TODO: generalize this path!
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
    var currentPath = path.join(__dirname, '../inputData' /*+ i */+ '.txt');

    allParamComboArr.push({hiddenLayers: hlArray, trainingObj: trainingObj, pathToData: currentPath});
  }

  parallelNets(allParamComboArr);
};
