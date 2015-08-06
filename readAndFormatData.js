var fs = require('fs');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var stream = require('stream');
var kpCompleteLocation;
var formatDataStreams = require('./formatDataStreams.js');
var dataSummary = require('./globals.js').dataSummary;

// FUTURE: build out the dataSummary object more quickly, rather than making a check on each individual row as we are now. 
var createdSummary = false;

module.exports = function(kpCompleteLocation, dataFileName, callback) {
  console.log('reading a file:', kpCompleteLocation);
  // For now, this is only for unencrypted information, such as kaggle competitions. If you would like to help us make this secure, please submit pull requests!
  // ADVANCED: allow the user to pass in an encrypted file
    // take in the encryption key for that file
    // write encrypted files to disk
    // read from the encrypted files. It will be slower, but more secure.
  var writeStream = fs.createWriteStream(path.join(kpCompleteLocation,'/formattingData.txt'), {encoding: 'utf8'});
  // NOTE: your data must be formatted using UTF-8. If you're getting weird errors and you're not sure how to do that, check out this blog post:
    // TODO: add in info on how to make sure your data is formatted using UTF-8
  var readStream = fs.createReadStream(path.join(kpCompleteLocation, dataFileName), {encoding: 'utf8'});
  console.log('we have created the write and read streams to format our data')


  var tStream1 = formatDataStreams.summarizeDataTransformStream();
  var tStream2 = formatDataStreams.calculateStandardDeviationTStream();
  var tStream3 = formatDataStreams.formatDataTransformStream();

  // Set up the piping on each successive read and transform and write streams
  var t1Start = Date.now();
  readStream.pipe(tStream1).pipe(writeStream);

  writeStream.on('finish', function() {
    // set the average property on each dataSummary key
    for (var column in dataSummary) {
      if (dataSummary[column].count !== 0) {
        dataSummary[column].mean = dataSummary[column].sum / dataSummary[column].count;
      }
    }

    var trainingTime = (Date.now() - t1Start) / 1000;
    var t2Start = Date.now();
    console.log('first transformStream took:',trainingTime);
    var writeStream2 = fs.createWriteStream(path.join(kpCompleteLocation,'/formattingData2.txt'), {encoding: 'utf8'});
    var readStream2 = fs.createReadStream(path.join(kpCompleteLocation,'/formattingData.txt'), {encoding: 'utf8'});
    readStream2.pipe(tStream2).pipe(writeStream2);
    
    writeStream2.on('finish', function() {

      console.log('finished the second transform!');
      for(var column in dataSummary) {
        var columnObj = dataSummary[column];
        
        if (columnObj.count !== 0) {
          columnObj.standardDeviation = columnObj.standardDeviationSum / (columnObj.count - columnObj.nullOrMissing - columnObj.countOfStrings);
          columnObj.range = columnObj.max - columnObj.min; 
        }
      }

      var trainingTime = (Date.now() - t2Start) / 1000;
      console.log('second transformStream took:',trainingTime);
      var t3Start = Date.now();

      var writeStream3 = fs.createWriteStream(path.join(kpCompleteLocation,'/formattingData3.txt'), {encoding: 'utf8'});
      var readStream3 = fs.createReadStream(path.join(kpCompleteLocation,'/formattingData2.txt'), {encoding: 'utf8'});

      // FUTURE: pipe this into a memcached or redis database. that way we'll be holding the entire dataset in memory, but just once
        // we would have to give the user the option of still writing to a file if their dataset is too large
        // since we're only holding the dataset in memory once, we don't need to worry about RAM issues
        // this will let us train much faster, since reading from RAM will be much faster than reading from a static file on our hard drive
        // even if we can't officially stream from the db, we can fake it by just querying for 10 lines at a time and pushing each line individually into the trainStream
        // yeah, that's definitely the way that we'll want to go. 
        // I think what we're going to have to do for that is set up a separate node.js server
          // that server will just hold in it's own memory the whole array
          // we'll make requests to that server for each new batch of 10k items we want
      readStream3.pipe(tStream3).pipe(writeStream3);
      
      writeStream3.on('finish', function() {
        console.log('finished the third transform!');
        var trainingTime = (Date.now() - t2Start) / 1000;
        console.log('third transformStream took:',trainingTime);

        // creates one copy of the dataset for each child process
        var copyTime = Date.now();
        var readCopyStream = fs.createReadStream(path.join(kpCompleteLocation,'/formattingData3.txt'), {encoding:'utf8'});
        readCopyStream.pause();
        readCopyStream.setMaxListeners(100);
        for (var i = 0; i < numCPUs; i++) {
          (function(idNum){
            var fileName = 'formattedData' + idNum + '.txt'
            var writeCopyStream = fs.createWriteStream(path.join(kpCompleteLocation,fileName), {encoding: 'utf8'});
            readCopyStream.pipe(writeCopyStream);
          })(i);
        }
        //just in case the writeStreams take some extra time to set up:
        setTimeout(function() {
          readCopyStream.resume();
        }, 100);

        readCopyStream.on('end', function() {
          console.log('finished copying in:', (Date.now() - copyTime) / 1000, 'seconds');
          totalRows = dataSummary.totalRows;
          chunkCount = dataSummary.chunkCount;
          callback(dataSummary);
          
        });
      });
    })
  });
}