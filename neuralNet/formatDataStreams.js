var stream = require('stream');
var nn = global.neuralNetwork;
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



  // tStream2: calculate standard deviations of numeric data. 
  calculateStandardDeviationTStream: function() {
    // tStream2: calculate standard deviations of numeric data. 
    var tStream2 = new stream.Transform({objectMode: true});
    tStream2._partialLineData = '';

    tStream2.processRow = function(row) {
      // console.log(row);
      row = JSON.parse(row);
      for (var k = 0; k < row.length; k++) {
        var itemAsNum = parseFloat(row[k]);
        if(itemAsNum.toString() !== 'NaN') {
          nn.dataSummary[k].standardDeviationSum+= Math.abs(itemAsNum - nn.dataSummary[k].mean);
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


}
