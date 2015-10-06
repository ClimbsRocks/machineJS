var stream = require('stream');
var nn = global.neuralNetwork;

// tStream2: calculate standard deviations of numeric data. 
module.exports = function() {
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

};
