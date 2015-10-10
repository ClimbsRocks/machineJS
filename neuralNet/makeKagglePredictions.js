var fs = require('fs');
var brain = require('brain');
var stream = require('stream');
var formattingUtils = require('./formattingUtils.js');
var path = require('path');
var nn = global.neuralNetwork;
var argv = global.argv;


module.exports = function(pathToKaggleData, ppCompleteLocation) {
  // nn = global.neuralNetwork;
  nn.dataSummary.isTesting = true;
  var net = new brain.NeuralNetwork();

  var bestNet = net.fromJSON( JSON.parse(nn.bestNetObj.trainingBestAsJSON));
  var trainingResults = {};

  var readFileStream = fs.createReadStream(path.join( ppCompleteLocation, pathToKaggleData), {encoding: 'utf8'});

  var firstTransformForTesting = formattingUtils.firstTransformForTesting(nn.dataSummary);
  var tStream = formattingUtils.formatDataTransformStream(nn.dataSummary);

  var testStream = new stream.Transform({objectMode: true});

  // the first column just contains the row names. 
  var firstRow = true;

  testStream._transform = function(chunk, encoding, done) {
    var data = chunk.toString();
    data = this._partialLineData + data;
    var rows = data.split('\n');
    this._partialLineData = rows.splice( rows.length - 1, 1 )[0];
    var resultsToPush = '';

    if(firstRow) {
      var headers = rows.shift();
      firstRow = false;
      resultsToPush+= 'ID,Probability\n';
    }

    for(var i = 0; i < rows.length; i++) {
      // console.log('inside writable streams chunk for loop, and row is:',rows[i]);
      var row = JSON.parse(rows[i]);

      // TODO TODO: we are getting output back that looks correct, but I think we have to pass in row.input, now the whole row. 
      // TODO: Potentially submit this as a PR to brainjs- the ability to pass in the entire row object to net.run, and then I'll check to see if there's an output value already, and if not, run it? 
      var results = bestNet.run(row.input);
      // row.output = results;
      // TODO: generalize away from assuming we just have a single numericOutput value
      // console.log('row:',row);
      var rowResults = row.rowID + ',' + results.numericOutput + '\n';
      // resultsToPush += JSON.stringify(row) + '\n';
      // console.log('results from testing!',rowResults);
      resultsToPush += rowResults;
    }

    // TODO: figure out what to do with the predictions from the net
      // add them to a giant chunk, then write that chunk to a file. 
    this.push(resultsToPush);
    done();
  };

  testStream._partialLineData = '';
  testStream._flush = function (done) {
    if (this._partialLineData) {
      var row = JSON.parse(this._partialLineData)
      var results = net.run(row);
      var rowResults = row.rowID + ',' + results.numericOutput + '\n';
      this.push(rowResults);
    }
    this._partialLineData = '';
    done();
  };


  var writeStream = fs.createWriteStream(path.join(ppCompleteLocation,'predictions/clneuralNetwork' + argv.dataFilePretty +'.csv'), {encoding: 'utf8'});

  // TODO: better variable naming
  readFileStream.pipe(firstTransformForTesting).pipe(tStream).pipe(testStream).pipe(writeStream);

  writeStream.on('finish', function() {
    console.log("you just made our neural network incredibly happy by letting it make predictions on the whole dataset for you! Now it's just wishing that you'll come back and give it more things to learn about...\n");

    console.log('in case you were curious, your best neural net had hidden layers:');
    console.log(nn.bestNetObj.hiddenLayers);
    console.log('\n');

    process.emit('algoFinishedTraining');
  });

// Deprecated:
//   // TODO TODO: create a new write stream that will write to file 
//   //   that will have to translate what is currently an object into a comma-separated string
//   //     the difficulty will be ensuring we keep the order. 
//   //     the output will be the first column, then i think we have everything stored into keys that are just numeric indices, so we should be able to treat it like a pseudo-array
//   //     we have the number of columns from nn.dataSummary, so just iterate through it. 

  // NOTE: your data must be formatted using UTF-8. If you're getting weird errors and you're not sure how to do that, check out this blog post:
    // TODO: add in info on how to make sure your data is formatted using UTF-8

  // Read in the data
  // format the data in the exact same way the training data is
    // this seems easy right now, but will become considerably more difficult once we have DilMil type data where we have categorical/binary data in a column, and then we need to cull it down to only the categories with enough coverage to be useful
    // we will likely need access to the nn.dataSummary object to know what the min and max were, as well as what categories were included. 
  // TODO: boot up a net from the best one that we've trained
  // run the formatted kaggle data through that net
  // TODO: write the output results to the file.
    // challenges:
      // 1. figuring out which column the output is in
      // 2. making sure we put the output in the right row
      // making sure we put the output in the right column
      // formattign the data given an uncertain column for the output. 
      // do we force the user to make the output column the first one, and then the id column the next one, or something consistent like that?
      // do we have them pass in a flag telling us what column number it is?
        // if so, let's make that flag 1-indexed to make it more similar to databases and MS Excel
      // i have a feeling we'll hae to recreate the table from scratch, writing to our own version of the file, and inserting each row one at a time. net.run is synchronous i believe, so keeping things in order should be pretty easy. 
      // format each row. i think we just need a string that has each column separated by a comma, and ending with a newline character. 
      // test this by opening it up in textEdit and Excel to visually verify, then test it by uploading to kaggle and making sure they have no issues with the format.
}
