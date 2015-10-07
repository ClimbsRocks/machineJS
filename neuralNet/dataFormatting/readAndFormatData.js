var fs = require('fs');
var path = require('path');
var numCPUs  = require('os').cpus().length;
var stream = require('stream');
var nn = global.neuralNetwork;
var argv = global.argv;
var formattingUtils = require(path.join(nn.location,'formattingUtils.js'));
nn.dataSummary = {
  createdSummary: false,
  totalRows: 0,
  chunkCount: 0,
  numFeatures: 0,
  countOfRows: 0,
  expectedRowLength: 0
};

module.exports = function( callback) {
  // For now, this is only for unencrypted information, such as kaggle competitions. If you would like to help us make this secure, please submit pull requests!
  // ADVANCED: allow the user to pass in an encrypted file
    // take in the encryption key for that file
    // write encrypted files to disk
    // read from the encrypted files. It will be slower, but more secure.
  var writeStream1 = fs.createWriteStream(path.join(nn.location,'/formattingData.txt'), {encoding: 'utf8'});
  // NOTE: your data must be formatted using UTF-8. If you're getting weird errors and you're not sure how to do that, check out this blog post:
    // TODO: add in info on how to make sure your data is formatted using UTF-8
  var readStream = fs.createReadStream(path.join(global.rootDir, argv.dataFile), {encoding: 'utf8'});


  var tStream1 = formattingUtils.summarizeDataTransformStream();
  // we need to only invoke these once we have a dataSummary object ready, on the previous stream's .'end' event
  // TODO TODO: pick the process back up here again. I'm in the middle of refactoring how we pass around the dataSummary object. The fact that we're doing it asynch means we can't just take it in as an argument to the functions we export from module.exports and then return it from that function. Instead, we're attaching it to the stream object itself, which is passed around, and then grabbing it on end events. 

  // Set up the piping on each successive read and transform and write streams
  var t1Start = Date.now();
  readStream.pipe(tStream1).pipe(writeStream1);

  writeStream1.on('finish', function() {
    // to deal with asynch issues, we are attaching the dataSummary object to tStream1 itself. 

    // set the average property on each dataSummary key
    for (var column in nn.dataSummary) {
      if (nn.dataSummary[column].count !== 0) {
        nn.dataSummary[column].mean = nn.dataSummary[column].sum / nn.dataSummary[column].count;
      }
    }

    var trainingTime = (Date.now() - t1Start) / 1000;
    var t2Start = Date.now();
    console.log('first transformStream took:',trainingTime);
    var writeStream2 = fs.createWriteStream(path.join(nn.location,'/formattingData2.txt'), {encoding: 'utf8'});
    var tStream2 = formattingUtils.calculateStandardDeviationTStream();
    var readStream2 = fs.createReadStream(path.join(nn.location,'/formattingData.txt'), {encoding: 'utf8'});
    readStream2.pipe(tStream2).pipe(writeStream2);
    
    writeStream2.on('finish', function() {

      for(var column in nn.dataSummary) {
        var columnObj = nn.dataSummary[column];
        
        if (columnObj.count !== 0) {
          columnObj.standardDeviation = columnObj.standardDeviationSum / (columnObj.count - columnObj.nullOrMissing - columnObj.countOfStrings);
          columnObj.range = columnObj.max - columnObj.min; 
        }
      }

      var trainingTime = (Date.now() - t2Start) / 1000;
      console.log('second transformStream took:',trainingTime);
      var t3Start = Date.now();

      var writeStream3 = fs.createWriteStream(path.join(nn.location,'/formattingData3.txt'), {encoding: 'utf8'});
      var tStream3 = formattingUtils.formatDataTransformStream();
      var readStream3 = fs.createReadStream(path.join(nn.location,'/formattingData2.txt'), {encoding: 'utf8'});

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
        var trainingTime = (Date.now() - t2Start) / 1000;
        console.log('third transformStream took:',trainingTime);

        // delete the intermediate files we have created
        fs.unlink(path.join(nn.location,'/formattingData.txt'));
        fs.unlink(path.join(nn.location,'/formattingData2.txt'));
        if(argv.copyData) {
          // creates one copy of the dataset for each child process
          var copyTime = Date.now();
          var readCopyStream = fs.createReadStream(path.join(nn.location,'/formattingData3.txt'), {encoding:'utf8'});
          readCopyStream.pause();
          readCopyStream.setMaxListeners(100);
          for (var i = 0; i < numCPUs; i++) {
            (function(idNum){
              var fileName = 'formattedData' + idNum + '.txt'
              var writeCopyStream = fs.createWriteStream(path.join(nn.location,fileName), {encoding: 'utf8'});
              readCopyStream.pipe(writeCopyStream);
            })(i);
          }
          console.log('after creating readCopyStream');
          //just in case the writeStreams take some extra time to set up:
          setTimeout(function() {
            console.log('resuming readCopyStream');
            readCopyStream.resume();
          }, 100);

          readCopyStream.on('end', function() {
            console.log('finished copying in:', (Date.now() - copyTime) / 1000, 'seconds');
            callback();
            
          });
          
        } else {
          callback();

        }
      });
    })
  });
}
