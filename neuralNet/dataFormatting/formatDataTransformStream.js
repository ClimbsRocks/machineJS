var stream = require('stream');
var nn = global.neuralNetwork;

// tStream3: 
  // normalize data 
  // turn it into a number between 0 and 1
  // binarize categorical data
  // TODO: take square or cubic roots of exponential data
  // overwrite missing data with median values
    // add in new columns as a binary to note that data is missing. columnOneDataMissing: 0, columnTwoDataMissing: 1, etc.
  // put it into our expected object format for brain.js
module.exports= function() {

  var tStream3 = new stream.Transform({objectMode: true});
  tStream3._partialLineData = '';

  tStream3.transformOneRow = function(row) {
    var brainObj = {
      input: {},
      output: {}
    };

    if( nn.dataSummary[0].categorical === true ) {
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
        brainObj.input[k] = (itemParsed - nn.dataSummary[k].min) / nn.dataSummary[k].range;

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
        // we include the column name in the feature name so that we don't have collisions (for example, a school might have different columns for different classes, and might fill each column with the same words, "Passed","Withdrew",etc. If we just included "Passed", rather than "artHistoryPassed", it would be meaningless).
        var featureName = item + k;
        brainObj.input[featureName] = 1;
        // TODO: figure out some way of making sure we only use the same features for testing that we did for training. 
        if(!nn.dataSummary.isTesting) {
          // if that feature does not exist in our nn.dataSummary obj yet:
          if(!nn.dataSummary[k].features[featureName]) {
            nn.dataSummary[k].features[featureName] = 1;
            nn.dataSummary.numFeatures++;
          } else {
            nn.dataSummary[k].features[featureName]++;
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
    nn.dataSummary.chunkCount++
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
};
