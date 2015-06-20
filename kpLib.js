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
    console.log('reading a file:',pathToData);
    // FUTURE: give them the option to invoke this from within a larger program as a module, or to just invoke it straight from the command line??
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
    //tStream1: format as arrays; get the mean and median for each column
    // TODO: get summary stats
      // mode
      // highest
      // lowest
      // distribution
      // how many outliers
      // etc. 
      // present these to the user to make sure they know what their data looks like
      // give them options for how to format that data (remove all rows with outliers, overwrite outliers with median data, etc.)
    // tStream2: calculate standard deviation for each column
    // tStream3: 
      // normalize data 
      // turn it into a number between 0 and 1
      // binarize categorical data
      // TODO: take square or cubic roots of exponential data
      // overwrite missing data with median values
        // add in new columns as a binary to note that data is missing. columnOneDataMissing: 0, columnTwoDataMissing: 1, etc.
      // put it into our expected object format for brain.js

    // tStream1: 
      // read data from initial data file
      // sum up numerical relevant data
      // count number of data points
      // make sure each row has the same number of data points
      // count missing/absent data
      // count strings vs. numbers

    var dataSummary = {};
    // FUTURE: build out this object more quickly, rather than making a check on each individual row as we are now. 
    var createdSummary = false;



    var tStream1 = new stream.Transform({objectMode: true});
    tStream1._partialLineData = '';
    var countOfRows = 0;
    var expectedRowLength = 0;

    tStream1._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;

      var rows = data.split('\r\n');
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      for(var i = 0; i < rows.length; i++) {
        var columns = rows[i].split(',');
        var thisRow = [];

        // Create the dataSummary object
        if( !createdSummary ) {
          createdSummary = true;
          // change this to be the names of each column
          // change this to include the categorical flag from row 2 (which is rows[1]). 
          // or actually, can we just assume that anything that's not a number is a string, and is therefore categorical? 
          // is there any case where we would have string values that are not categorical?
          // is there any data we would accept other than categorical (string) or numbers?
          // we might have to force string representations of numbers to be actual numbers. 
          // this is probably an area we'd have to give the user some control over. usernames would normally be strings, but we might occasionally have a username that is a number (represented as a string). we could go through and do a majority rules type of thing, but then, i'd be worried about sparse data (we're missing bank account info for most customers, but we have it for a few, so therefore, it's going to look lifke the majority are not numbers). we could possibly work around this by utilizing the nullOrMissing count in this calculation. 
          // no it's simpler than that. let's just be strict. number columns must be numbers. FUTURE: we could build in some flexibility here (if 98% of the values present in a column- excluding missing- are numbers, then we'll assume it's a numerical column and just ignore the random strings). 
          expectedRowLength = columns.length;
          for (var j = 0; j < columns.length; j++) {
            dataSummary[j] = {
              sum: 0, //FUTURE: figure out how we want to handle negative numbers. 
              standardDeviationSum: 0,
              standardDeviation: undefined,
              count: 0,
              nullOrMissing: 0,
              countOfZeros: 0,
              countOfStrings: 0,
              median: undefined, //FUTURE: this one will be more difficult to figure out. 
              mean: undefined
            };
          }
          console.log('dataSummary at the start');
          console.log(dataSummary);
        }

        if(columns.length !== expectedRowLength) {
          console.log('this row appears to be a different length than expected:');
          console.log(columns);
        } else {
          // iterate through the columns for this particular row. 
          for (var j = 0; j < columns.length; j++) {
            dataSummary[j].count++;
            var item = columns[j];
            if(item.toString() === 'NaN') {
              console.log('the raw item is NaN');
            }
            if(parseFloat(item, 10).toString() !== 'NaN') {
              item = parseFloat(item);
              if(item.toString() === 'NaN') console.log('the parsed item is NaN');
            }
            if(typeof item === 'number') {
              if(item.toString() === 'NaN') console.log('the item checked against number is NaN');
              dataSummary[j].sum += item;
              if(dataSummary[j].sum.toString() === 'NaN') {
                console.log('sum is NaN, j is:', j,"i is:", i);
              }
              if(item === 0) {
                dataSummary[j].countOfZeros++;
              }
            } else if (item === undefined || item === null || item === "N/A" || item === "NA" || item === '') {//FUTURE: revisit what we include as missing values. NA could be one, but NA could also stand for North America. Do we really want to include empty strings as missing values? 
              dataSummary[j].nullOrMissing++;
            } else if (typeof item === 'string') {
              dataSummary[j].countOfStrings++;
            } else {
              console.log('we do not know what to do with this value:',item, 'which is in column number:',j);
            }
            thisRow.push(columns[j]);
          }

          // FUTURE: do this in larger chunks. do 10 rows at a time before pushing to the stream. definitely combine the newline character. 
          this.push(JSON.stringify(thisRow));
          this.push('\n');
          columns = [];
        } 
      }
      done();
    };

    tStream1._flush = function (done) {
      if (this._partialLineData) {
        this.push(this._partialLineData);
      }
      this._partialLineData = '';
      done();
    };



    // tStream2: calculate standard deviations of numeric data. 
    var tStream2 = new stream.Transform({objectMode: true});
    tStream2._partialLineData = '';

    tStream2._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;

      var rows = data.split('\n');
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      for(var i = 0; i < rows.length; i++) {
        rows[i] = JSON.parse(rows[i]);
        for (var k = 0; k < rows[i].length; k++) {
          // TODO: make sure i'm calculating standard dev the right way
          var itemAsNum = parseFloat(rows[i][k]);
          if(itemAsNum.toString() !== 'NaN') {
            dataSummary[k].standardDeviationSum+= Math.abs(itemAsNum - dataSummary[k].mean);
          }
        }
        // FUTURE: do this in larger chunks. do 10 rows at a time before pushing to the stream. definitely combine the newline character. 
        this.push(JSON.stringify(rows[i]));
        this.push('\n');
        columns = [];
      } 
      done();
    };

    tStream2._flush = function (done) {
      if (this._partialLineData) {
        this.push(this._partialLineData);
      }
      this._partialLineData = '';
      done();
    };



    // tStream3: 
      // normalize data 
      // turn it into a number between 0 and 1
      // binarize categorical data
      // TODO: take square or cubic roots of exponential data
      // overwrite missing data with median values
        // add in new columns as a binary to note that data is missing. columnOneDataMissing: 0, columnTwoDataMissing: 1, etc.
      // put it into our expected object format for brain.js

    var tStream3 = new stream.Transform({objectMode: true});
    tStream3._partialLineData = '';

    tStream3._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;
      // console.log('data:',data);

      var rows = data.split('\n');
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      // console.log('rows in second transform',rows);
      for(var i = 0; i < rows.length; i++) {
        // console.log('rows[i]:',rows[i]);
        rows[i] = JSON.parse(rows[i]);
        for (var k = 0; k < rows[i].length; k++) {
          // console.log('rows[i][k]:',rows[i][k]);
          // console.log('dataSummary[k]:', dataSummary[k], 'k:',k);
          // TODO: make sure i'm calculating standard dev the right way
          var itemAsNum = parseFloat(rows[i][k]);
          if(itemAsNum.toString() !== 'NaN') {

            // TODO: build out all logic here
            // TODO: put more thought into how we handle the output
              // it will likely be categorical
              // we should tell the user to always make it the first column in our dataset?
          }
        }
        this.push(JSON.stringify(rows[i]));
        columns = [];
      } 
      done();
    };

    tStream3._flush = function (done) {
      if (this._partialLineData) {
        this.push(this._partialLineData);
      }
      this._partialLineData = '';
      done();
    };


    // Set up the piping on each successive read and transform and write streams
    
    readStream.pipe(tStream1).pipe(writeStream);

    writeStream.on('finish', function() {
      // create the mean property on each dataSummary key
      for (var column in dataSummary) {
        // TODO: think if we want to divide by something else? 
        if (dataSummary[column].count !== 0) {
          dataSummary[column].mean = dataSummary[column].sum / dataSummary[column].count;
          
        }
      }

      console.log('dataSummary:', dataSummary);
      var writeStream2 = fs.createWriteStream('formattingData2.txt', {encoding: 'utf8'});
      var readStream2 = fs.createReadStream('formattingData.txt', {encoding: 'utf8'});
      readStream2.pipe(tStream2).pipe(writeStream2);
      
      writeStream2.on('finish', function() {

        console.log('finished the second transform!');
        for(var column in dataSummary) {
          if (dataSummary[column].count !== 0) {
            // TODO: this is just MVP for standard deviation calculations. make sure this math is right once i've got an internet connection again. in particular, should we be using a different denominator?
            dataSummary[column].standardDeviation = dataSummary[column].standardDeviationSum / (dataSummary[column].count - dataSummary[column].nullOrMissing - dataSummary[column].countOfStrings);
            
          }

        }
        console.log('dataSummary after standard deviation calculation:', dataSummary);
        var writeStream3 = fs.createWriteStream('formattingData3.txt', {encoding: 'utf8'});
        var readStream3 = fs.createReadStream('formattingData2.txt', {encoding: 'utf8'});

        // FUTURE: pipe this into a memcached or redis database. that way we'll be holding the entire dataset in memory, but just once
          // we would have to give the user the option of still writing to a file if their dataset is too large
          // since we're only holding the dataset in memory once, we don't need to worry about RAM issues
          // this will let us train much faster, since reading from RAM will be much faster than reading from a static file on our hard drive
          // even if we can't officially stream from the db, we can fake it by just querying for 10 lines at a time and pushing each line individually into the trainStream
          // yeah, that's definitely the way that we'll want to go. 
        readStream3.pipe(tStream3).pipe(writeStream3);
        
        writeStream3.on('finish', function() {
          console.log('finished the third transform!');
          // invoke multipleNetAlgo()?
        });
      })
    });




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
    // TODO: point this to wherever kpComplete is on your computer. 
    // start this by booting up 
    // KATRINA: change this directory to where your kpComplete folder is. 
    var child = child_process.fork('./brainChild',{cwd: '/Users/preston/ghLocal/machineLearningWork/kpComplete'});
    child.send(allParamComboArr[i]);
    child.on('message', function(message) {
      console.log('parent received a message from its child:');
      // KATRINA: we have completed training on a new net. here's where you'll invoke a functoin to check those results against our current results, and then spin up a new new to test. 
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
  console.log('allParamComboArr:',allParamComboArr);

  parallelNets(allParamComboArr);
};
