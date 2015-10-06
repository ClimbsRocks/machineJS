var stream = require('stream');
var nn = global.neuralNetwork;

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
      console.log('try making sure your header row has labels for each column (no blank spaces), and that each row has data for each column, even if that data is just an empty string, or a string that says "null"');
      // console.log(columns);
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
};
