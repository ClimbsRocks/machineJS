var fs = require('fs');
var brain = require('brain');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var stream = require('stream');

console.log('numCPUs:',numCPUs);

var bestNet = {
  jsonBackup: '',
  errorRate: 1,
  trainingTime: Infinity
};

module.exports = {
  readFile: function(pathToData) {
    // TODO: allow the user to give us either a file path, or a fully formatted dataset in JS. Maybe give them both train and readFile as APIs, and readFile will invoke train();
    // TODO: again, figure out where we want to write this to the computer
    // TODO: figure out how to write it securely (encryption, etc.)
    // TODO: figure out how to delete it from the computer
    // TODO: warn the user about this. 
    // TODO: tell the user when we are done reading the data so that they can delete their .csv file if it's something that would normally be encrypted on their end. 
    // For now, this is only for unencrypted information, such as kaggle competitions. If you would like to help us make this secure, please submit pull requests!
    var writeStream = fs.createWriteStream('formattingData.txt', {encoding: 'utf8'});
    // NOTE: your data must be formatted using UTF-8. If you're getting weird errors and you're not sure how to do that, check out this blog post:
      // TODO: add in info on how to make sure your data is formatted using UTF-8
    var readStream = fs.createReadStream(pathToData, {encoding: 'utf8'});

    var transformStream = new stream.Transform({objectMode: true});
    transformStream._partialLineData = '';

    transformStream._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;

      var rows = data.split('\r\n');
      console.log(rows);
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      for(var i = 0; i < rows.length; i++) {
        var columns = rows[i].split(',');
        var thisRow = [];
        for (var j = 0; j < columns.length; j++) {
          thisRow.push(columns[j]);
        }
        this.push(JSON.stringify(thisRow));
        columns = [];
      }
      done();
    };

    transformStream._flush = function (done) {
      if (this._partialLineData) {
        this.push(this._partialLineData);
      }
      this._partialLineData = '';
      done();
    };

    readStream.pipe(transformStream).pipe(writeStream);


    // Pseudocode:
    // figure out formatting with commas
      // likely, each row gets made into an array
      // each item in that array will be the next column's data
    // Along the way:
      // gather number of values (what did i mean by this??)
      // gather information like averages and standard deviations (for things like normalization)

    // NOTE: we are not creating features for you; we are just turning the features you've already created into data that brain.js expects to see*
      // *we are creating one set of features for whether or not a value is missing from the dataset

    // Then, create another transformStream
    // this one will 
      // normalize our data
      // then turn it into a value between 0 and 1
      // turn categorical into booleans
      // turn it into an object that brainjs expects to see
    //  along the way, we need to replace rows with missing information with either:
      // that column's median value
      // 0
        // Maybe over time experiment with randomly replacing a given row with either one?
        // if we're missing few values, replace with the median
        // if we're missing many values, replace with 0
      // if categorical, a category stating that it was a missing value
    // When we replace information: 
      // create a new column of data saying that we've replaced data for this row
    // i'm not going to worry about sparse arrays for now, though i have a feeling the object-based-approach i have in mind will be somewhat efficient at dealing with the problem sparse arrays are trying to solve. 


    // PROBLEM AREAS: 
      // something like height should be normalized according to gender
      // how do we handle something like loan utilization rate (numbers from .01 to 1000, lower is better)?
      // I did a bunch of cube rooting. does normalization with standard deviations handle this, or should we continue to do something like this?
        // maybe only in cases where the curve of data is exponential. what i'm picturing is a curve where the largest numbers are relatively rare, but are notably higher than anything else. distance in the DilMil dataset is the example i'm thinking of at the moment. we're really interested in the difference between people who are 5 vs. 50 vs. 200 miles away from each other, but the dataset includes people who are 5,000 miles away so those differences are going to be hard to see. 
        // we can probably run it through a program to figure out if our data is roughly linear, random, or exponential in it's distribution. then, if it's exponential, we can potentially measure "how" exponential, and take the square or cube or quadratic root of it from there. 
      // Matching: DilMil: does User A's preference match User B's observed value? Does user A's category X match user b's category X

    // dealing with properties that only are present in a tiny portion of the rows (if city is a categorical column, we'd want to keep Chicago, but not always Akron, and rarely Bath or Fairlawn). 
    // We could potentially make two different versions of the dataset, one that incldues all the sparse features, one with fewer sparse features, test both, and see if either is more predictive (or trains notably faster). 

  },

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

    writeStream.on('drain', function() {
      writeStream.end();
    });

    writeStream.on('finish', function() {

      console.log('finished writing the data to a file');
      trainingData = null; //make sure to no longer point any variables to our trainingData, in case any still exists. 

      multipleNetAlgo();

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

module.exports.readFile('./kpComplete/kaggleTrainingData.csv');


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
    var currentPath = path.join(__dirname, '../inputData.txt');

    allParamComboArr.push({hiddenLayers: hlArray, trainingObj: trainingObj, pathToData: currentPath});
  }

  parallelNets(allParamComboArr);
};
