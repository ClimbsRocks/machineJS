// var dataSummary = {
//   createdSummary: false,
//   totalRows: 0,
//   chunkCount: 0,
//   numFeatures: 0,
//   countOfRows: 0,
//   expectedRowLength: 0
// };
var stream = require('stream');

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
  // We aren't using this at all anymore. 
// tStream3: 
  // normalize data 
  // turn it into a number between 0 and 1
  // binarize categorical data
  // TODO: take square or cubic roots of exponential data
  // overwrite missing data with median values
    // add in new columns as a binary to note that data is missing. columnOneDataMissing: 0, columnTwoDataMissing: 1, etc.
  // put it into our expected object format for brain.js

module.exports = {

  // This stream simply summarizes the data. It does not modify the data in any way.
  // tStream1: 
    // read data from initial data file
    // sum up numerical relevant data
    // count number of data points
    // make sure each row has the same number of data points
    // count missing/absent data
    // count strings vs. numbers
  summarizeDataTransformStream: function (dataSummary) {
    var tStream1 = new stream.Transform({objectMode: true});
    tStream1._partialLineData = '';
    tStream1.dataSummary = dataSummary;
    // var countOfRows = 0; 
    // var expectedRowLength = 0; //we want this to be available for all of our transformStreams. could consider making it a variable on tStream1 later to make it slightly cleaner. 
    tStream1.transformOneRow = function(columns) {
      var thisRow = [];
      if(columns.length !== tStream1.dataSummary.expectedRowLength) {
        console.log('this row appears to be a different length than expected:');
        console.log(columns);
      } else {
        tStream1.dataSummary.totalRows++;
        // iterate through the columns for this particular row. 
        for (var j = 0; j < columns.length; j++) {
          tStream1.dataSummary[j].count++;
          var item = columns[j];
          if(parseFloat(item, 10).toString() !== 'NaN') {
            item = parseFloat(item);
          }
          if(typeof item === 'number') {
            tStream1.dataSummary[j].sum += item;
            if(item === 0) {
              tStream1.dataSummary[j].countOfZeros++;
            }
            if(item < tStream1.dataSummary[j].min) {
              tStream1.dataSummary[j].min = item;
            } else if (item > tStream1.dataSummary[j].max) {
              tStream1.dataSummary[j].max = item;
            }
          } else if (item === undefined || item === null || item === "N/A" || item === "NA" || item === '') {//FUTURE: revisit what we include as missing values. NA could be one, but NA could also stand for North America. Do we really want to include empty strings as missing values? 
            tStream1.dataSummary[j].nullOrMissing++;
          } else if (typeof item === 'string') {
            tStream1.dataSummary[j].countOfStrings++;
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

        // Create the tStream1.dataSummary object
        if( !tStream1.dataSummary.createdSummary ) {
          tStream1.dataSummary.createdSummary = true;
          // change this to be the names of each column
          // change this to include the categorical flag from row 2 (which is rows[1]). 
          // or actually, can we just assume that anything that's not a number is a string, and is therefore categorical? 
          // is there any case where we would have string values that are not categorical?
          // is there any data we would accept other than categorical (string) or numbers?
          // we might have to force string representations of numbers to be actual numbers. 
          // this is probably an area we'd have to give the user some control over. usernames would normally be strings, but we might occasionally have a username that is a number (represented as a string). we could go through and do a majority rules type of thing, but then, i'd be worried about sparse data (we're missing bank account info for most customers, but we have it for a few, so therefore, it's going to look lifke the majority are not numbers). we could possibly work around this by utilizing the nullOrMissing count in this calculation. 
          // no it's simpler than that. let's just be strict. number columns must be numbers. FUTURE: we could build in some flexibility here (if 98% of the values present in a column- excluding missing- are numbers, then we'll assume it's a numerical column and just ignore the random strings). 
          tStream1.dataSummary.expectedRowLength = columns.length;
          tStream1.dataSummary.numFeatures = columns.length -1; // we subtract one so that we do not include the output column as a feature of the input. 
          for (var j = 0; j < columns.length; j++) {
            tStream1.dataSummary[j] = {
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
  },

  firstTransformForTesting: function (dataSummary) {
    var tStream1 = new stream.Transform({objectMode: true});
    tStream1._partialLineData = '';
    tStream1.dataSummary = dataSummary;
    // var countOfRows = 0; 
    // var expectedRowLength = 0; //we want this to be available for all of our transformStreams. could consider making it a variable on tStream1 later to make it slightly cleaner. 
    tStream1.transformOneRow = function(columns) {
      var thisRow = [];
      if(columns.length !== tStream1.dataSummary.expectedRowLength) {
        console.log('this row appears to be a different length than expected:');
        console.log(columns);
      } else {
        // iterate through the columns for this particular row. 
        for (var j = 0; j < columns.length; j++) {
          var item = columns[j];
          if(parseFloat(item, 10).toString() !== 'NaN') {
            item = parseFloat(item);
          }
          thisRow.push(item);
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

        // Create the tStream1.dataSummary object
        var transformedRow = this.transformOneRow(columns);
        rowsToPush += JSON.stringify(transformedRow) + '\n';
        columns = []; //i'm not entirely sure if this is necessary, but it seems like it will be helpful in cases with errors. 
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
  },

  // tStream2: calculate standard deviations of numeric data. 
  calculateStandardDeviationTStream: function(dataSummary) {
    // tStream2: calculate standard deviations of numeric data. 
    var tStream2 = new stream.Transform({objectMode: true});
    tStream2._partialLineData = '';
    tStream2.dataSummary = dataSummary;

    tStream2.processRow = function(row) {
      // console.log(row);
      row = JSON.parse(row);
      for (var k = 0; k < row.length; k++) {
        var itemAsNum = parseFloat(row[k]);
        if(itemAsNum.toString() !== 'NaN') {
          tStream2.dataSummary[k].standardDeviationSum+= Math.abs(itemAsNum - tStream2.dataSummary[k].mean);
        }
      }
      return row;
    }

    tStream2._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;
      var rowsToPush = '';

      var rows = data.split('\n');
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      for(var i = 0; i < rows.length; i++) {
        var processedRow = this.processRow(rows[i]);
        
        rowsToPush += JSON.stringify(processedRow) + '\n';
      } 
      this.push(rowsToPush);
      done();
    };

    tStream2._flush = function (done) {
      if (this._partialLineData) {
        var processedRow = this.processRow(this._partialLineData);
        this.push(JSON.stringify(processedRow));
      }
      this._partialLineData = '';
      done();
    };

    return tStream2;

  },

  // tStream3: 
    // normalize data 
    // turn it into a number between 0 and 1
    // binarize categorical data
    // TODO: take square or cubic roots of exponential data
    // overwrite missing data with median values
      // add in new columns as a binary to note that data is missing. columnOneDataMissing: 0, columnTwoDataMissing: 1, etc.
    // put it into our expected object format for brain.js
  formatDataTransformStream: function(dataSummary) {

    var tStream3 = new stream.Transform({objectMode: true});
    tStream3._partialLineData = '';
    tStream3.dataSummary = dataSummary;

    tStream3.transformOneRow = function(row) {
      var brainObj = {
        input: {},
        output: {}
      };

      if( tStream3.dataSummary[0].categorical === true ) {
        brainObj.output[row[0]] = 1; //if we have categorical data, we want to set that category to true
      } else {
        brainObj.output['numericOutput'] = row[0]; // if we have numerica data (we shouldn't, unless that number is simply a category, such as didDefault), we want to set the output equal to that number
      }

      for (var k = 1; k < row.length; k++) {
        var item = row[k]
        var itemParsed = parseFloat(item);
        // if the item is a number:
        if(itemParsed.toString() !== 'NaN') {
          
          // uses basic min-max normalization.
          brainObj.input[k] = (itemParsed - tStream3.dataSummary[k].min) / tStream3.dataSummary[k].range;

          // these checks are in place for our testData, which might have slightly more extreme values than our trainingData. 
          // FUTURE: see if there's a better way to handle this 
          if(brainObj.input[k] > 1) {
            brainObj.input[k] = 1;
          } else if(brainObj.input[k] < 0) {
            brainObj.input[k] = 0;
          }
          // TODO: put more thought into how we handle the output
            // it will likely be categorical
            // we should tell the user to always make it the first column in our dataset?
            // FUTURE: include regressions as well
            // ADVANCED: give them the option to specify multiple output columns if we are predicting multiple output types (they are both a likeMatch and a messagingMatch, but not a phoneMatch). They'd have to label each output column with the word 'output' in the second row. 
        } else if (item === undefined || item === null || item === "N/A" || item === "NA" || item === '') {
            brainObj.input[k] = 0 //FUTURE: make this equal to the median value if we have values for more than 70% of items. continue to make it equal to 0 if we have sparse input (if we have values for less than 70% of rows)
            // ADVANCED: give them control of how to replace missing or null values
            // ADVANCED: give them control of what is considered a missing or null value. particularly NA. but maybe for them -1 is considered a missing value. 
        } else if (typeof item === 'string') {
          // handles categorical data
          // we include the column name in the feature name so that we don't have collisions (for example, a school might have different columns for different classes, and might fill each cell with "Passed","Withdrew",etc. If we just included "Passed", rather than "Grade12Passed", it would be meaningless).
          var featureName = item + k;
          brainObj.input[featureName] = 1;
          // TODO: figure out some way of making sure we only use the same features for testing that we did for training. 
          if(!tStream3.dataSummary.isTesting) {
            // if that feature does not exist in our tStream3.dataSummary obj yet:
            if(!tStream3.dataSummary[k].features[featureName]) {
              tStream3.dataSummary[k].features = 1;
              tStream3.dataSummary.numFeatures++;
            } else {
              tStream3.dataSummary[k].features[featureName]++;
            }

          } 
        } else {
          console.error('we have not yet figured out how to handle data for this column number:',k,'values:',item);
          
        }
      }

      // for now, we are assuming that the second column contains an ID for that row. This is important for makeKagglePredictions (and likely won't mess anything up if we are not doing a kagglePrediction and we don't have a rowID). 
      brainObj.rowID = row[1];

      //earmark 20% of our dataset for testing. 
      if(Math.random() > 0.8) {
        brainObj.testingDataSet = true;
      }

      return brainObj;
    };

    tStream3._transform = function (chunk, encoding, done) {
      var data = chunk.toString();
      data = this._partialLineData + data;

      var rowsToPush = '';
      var rows = data.split('\n');
      this._partialLineData = rows.splice( rows.length - 1, 1 )[0];

      for(var i = 0; i < rows.length; i++) {
        var row = JSON.parse(rows[i]);
        var brainObj = this.transformOneRow(row);
        
        rowsToPush += JSON.stringify(brainObj) + '\n';
        // reset columns, row, and brainObj
        // CLEAN: This is probably not necessary anymore, since it looks like those variables have been modularized out into their own scope.
        columns = [];
        row = '';
        brainObj = '';
      } 
      tStream3.dataSummary.chunkCount++
      this.push(rowsToPush);
      done();
    };

    tStream3._flush = function (done) {
      if (this._partialLineData) {
        var brainObj = this.transformOneRow(JSON.parse(this._partialLineData));
        this.push(JSON.stringify(brainObj));
      }
      this._partialLineData = '';
      done();
    };

    return tStream3;
  }

}
