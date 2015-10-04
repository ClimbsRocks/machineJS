var csv = require('csv');
var fs = require('fs');
var path = require('path');
var predictions = {};

module.exports = {

  consolidateFiles: function(globalArgs) {
    // eventually we're just going to automatically gather all of the .csv files in this folder. hardcoding for now. 
    var fileName = 'neuralNetwork.csv';

    var filePath = path.join(globalArgs.ppCompleteLocation,'predictions',fileName);
    var firstRow = true;
    var parser = csv.parse({}, function(err, row) {
      if (firstRow) {
        firstRow = false;
        // skip it! 
      } else {
        console.log('row:',row);
        var id = row[0];
        if(predictions[id] === undefined) {
          predictions[id] = {};
        }
        predictions[id].fileName = row[1];
        
      }
    });

    fs.createReadStream(filePath).pipe(parser);
    
  }
};
