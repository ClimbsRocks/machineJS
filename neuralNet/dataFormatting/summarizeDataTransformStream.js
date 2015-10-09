var nn = global.neuralNetwork;
var stream = require('stream');

// This stream simply summarizes the data. It does not modify the data in any way.
// tStream1: 
  // read data from initial data file
  // sum up numerical relevant data
  // count number of data points
  // make sure each row has the same number of data points
  // count missing/absent data
  // count strings vs. numbers
module.exports = function () {
  var tStream1 = new stream.Transform({objectMode: true});
  tStream1._partialLineData = '';
  // var countOfRows = 0; 
  // var expectedRowLength = 0; //we want this to be available for all of our transformStreams. could consider making it a variable on tStream1 later to make it slightly cleaner. 
  tStream1.transformOneRow = function(columns) {
    var thisRow = [];
    if(columns.length !== nn.dataSummary.expectedRowLength) {
      console.log('this row appears to be a different length than expected:');
      console.log('we expected to see a row that had',nn.dataSummary.expectedRowLength,'columns in it, and instead this row has',columns.length,'columns in it.');
      console.log(columns);
      console.log('try making sure your header row has labels for each column (no blank spaces), and that each row has data for each column, even if that data is just an empty string, or a string that says "null"');
      // console.log(columns);
    } else {
      nn.dataSummary.totalRows++;
      // iterate through the columns for this particular row. 
      for (var j = 0; j < columns.length; j++) {
        nn.dataSummary[j].count++;
        var item = columns[j];
        if(parseFloat(item, 10).toString() !== 'NaN') {
          item = parseFloat(item);
        }
        if(typeof item === 'number') {
          nn.dataSummary[j].sum += item;
          if(item === 0) {
            nn.dataSummary[j].countOfZeros++;
          }
          if(item < nn.dataSummary[j].min) {
            nn.dataSummary[j].min = item;
          } else if (item > nn.dataSummary[j].max) {
            nn.dataSummary[j].max = item;
          }
        } else if (item === undefined || item === null || item === "N/A" || item === "NA" || item === '') {//FUTURE: revisit what we include as missing values. NA could be one, but NA could also stand for North America. Do we really want to include empty strings as missing values? 
          nn.dataSummary[j].nullOrMissing++;
        } else if (typeof item === 'string') {
          nn.dataSummary[j].countOfStrings++;
        } else {
          console.log('we do not know what to do with this value:',item, 'which is in column number:',j);
        }
        thisRow.push(columns[j]);
      }
    }
    return thisRow;
  }

  tStream1._transform = function (chunk, encoding, done) {
    var data = chunk.toString();
    data = this._partialLineData + data;

    // replaces all line endings with just '\n'
    data = data.replace(/(\r\n|\n|\r)/gm,'\n');

    var rowsToPush = '';

    var rows = data.split('\n');
    // it would be unusual for the readStream to break perfectly at a line ending each time, so we assume the final thing it gives us is a partial line, whihc we'll need to add onto the data it gives us on the next read. 
    this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

    for(var i = 0; i < rows.length; i++) {
      // ADVANCED: give them the option of using other things as column separators, such as | or semicolon
      var columns = rows[i].split(',');

      // Create the nn.dataSummary object
      if( !nn.dataSummary.createdSummary ) {
        nn.dataSummary.createdSummary = true;
        // change this to be the names of each column
        // change this to include the categorical flag from row 2 (which is rows[1]). 
        // or actually, can we just assume that anything that's not a number is a string, and is therefore categorical? 
        // is there any case where we would have string values that are not categorical?
        // is there any data we would accept other than categorical (string) or numbers?
        // we might have to force string representations of numbers to be actual numbers. 
        // this is probably an area we'd have to give the user some control over. usernames would normally be strings, but we might occasionally have a username that is a number (represented as a string). we could go through and do a majority rules type of thing, but then, i'd be worried about sparse data (we're missing bank account info for most customers, but we have it for a few, so therefore, it's going to look lifke the majority are not numbers). we could possibly work around this by utilizing the nullOrMissing count in this calculation. 
        // no it's simpler than that. let's just be strict. number columns must be numbers. FUTURE: we could build in some flexibility here (if 98% of the values present in a column- excluding missing- are numbers, then we'll assume it's a numerical column and just ignore the random strings). 
        nn.dataSummary.expectedRowLength = columns.length;
        nn.dataSummary.numFeatures = columns.length -1; // we subtract one so that we do not include the output column as a feature of the input. 
        for (var j = 0; j < columns.length; j++) {
          nn.dataSummary[j] = {
            sum: 0, //FUTURE: figure out how we want to handle negative numbers. 
            standardDeviationSum: 0,
            standardDeviation: undefined,
            count: 0,
            nullOrMissing: 0,
            countOfZeros: 0,
            countOfStrings: 0,
            median: undefined, //FUTURE: this one will be more difficult to figure out. 
              // sort the column, find the middle item
              // sorting seems challenging with streams
                // happily, merge sort seems like the kind of thing we could do with a stream
                // or, just google around
                // hopefully there's a library for this. 
            mean: undefined,
            max: rows[i+1].split(',')[j], //FUTURE: grab the first row's value for the coluumn as the max and min values
            min: rows[i+1].split(',')[j], 
            range: undefined,
            rangeAbove: undefined, // we aren't using this at the moment
            rangeBelow: undefined, //we aren't using this at the moment
            standardDeviationRange: undefined,
            categorical: undefined
          };

        }
        columns = [];
      } else {
        var transformedRow = this.transformOneRow(columns);
        rowsToPush += JSON.stringify(transformedRow) + '\n';
        columns = []; //i'm not entirely sure if this is necessary, but it seems like it will be helpful in cases with errors. 
      } 
    }
    this.push(rowsToPush);
    done();
  };

  tStream1._flush = function (done) {
    if (this._partialLineData) {
      var columns = this._partialLineData.split(',');
      var transformedRow = this.transformOneRow(columns)
      this.push(JSON.stringify(transformedRow));
    }
    this._partialLineData = '';
    done();
  };
  return tStream1;
};
