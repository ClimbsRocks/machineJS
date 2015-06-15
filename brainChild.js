process.on('message', function(message) {
  var startTime = Date.now();
  var path = require('path');
  var fs = require('fs');
  // TODO: navigate to brain.js inside of our own node module. once we turn this into a module, of course. 
  var brain = require('brain');
  var byline = require('byline');
  // var Promise = require(path.join(__dirname + '../../../bluebird/js/main/bluebird.js'));
  console.log('inside a child_process');
  var stream = require('stream');

  var net = new brain.NeuralNetwork(); 


  var trainStream = net.createTrainStream({
    errorThresh: message.trainingObj.errorThresh,  // error threshold to reach
    iterations: message.trainingObj.iterations,    // maximum training iterations
    log: message.trainingObj.log,          // console.log() progress periodically
    logPeriod: message.trainingObj.logPeriod,       // number of iterations between logging
    learningRate: message.trainingObj.learningRate,   // learning rate
    /**
     * Write training data to the stream. Called on each training iteration.
     */

    //Streams happen asynchronously. 
    floodCallback: function() {
      // TODO: Investigate this if there are bugs
      var currentPath = message.pathToData;
      var readStream = fs.createReadStream(currentPath, {encoding:'utf8'});
      // readStream = byline(readStream);
      // var parseStream = new stream.Transform();
      // parseStream._transform = function(chunk, encoding, done) {
      //   chunk = JSON.parse(chunk);
      //   this.push(chunk, 'utf8');
      //   done();
      // }
      // readStream.pipe(parseStream).pipe(trainStream);
      // TODO: create a transform stream.
        // This stream will take in the raw readfile string
        // make sure the encoding is figured out
        // break it out by line
        // make sure that everything's parsed to be js objects
        // pass each individual object onto our trainStream.
        // there will be a different number of incoming chunks than there will be outgoing objects
        // be sure to handle line endings breaking midline
        var transformStream = new stream.Transform({objectMode: true});
        transformStream._partialLineData = '';

        transformStream._transform = function (chunk, encoding, done) {
          // TODO: investigate this parsing if things break. 
          var data = chunk.toString();
          data = this._partialLineData + data;

          var lines = data.split('\n');
          this._partialLineData = lines.splice( lines.length - 1, 1 )[0];

          for(var i = 0; i < lines.length; i++) {
            this.push(JSON.parse(lines[i]));
          }
          done();
        };

        transformStream._flush = function (done) {
          if (this._partialLineData) {
            this.push(this._partialLineData);
          }
          this._partialLineData = '';
          done();
        };
        readStream.pipe(transformStream).pipe(trainStream, {end: false});

        // readStream.on('data', function(data) {
        //   trainStream.write(JSON.parse(data));
        // });
        readStream.on('end', function() {
          trainStream.write(null);  
        });
      },

    /**
     * Called when the network is done training.
     */
     doneTrainingCallback: function(obj) {
      var trainingTime = Date.now() - startTime;
      console.log("trained in " + obj.iterations + " iterations with error: "
        + obj.error + "taking", trainingTime,"seconds.");
      // TODO: invoke bestNetChecker here. Well, we can't, because this thread is actually in a different memory space. 
      // TODO: write the fully trained net to a file. Save a path to that file. Make it in the same location as our inputData.txt file. 
      returnData = obj;
      // TODO: add our net to returnData
      returnData.net = net.toJSON();
      returnData.trainingTime = trainingTime;

      process.send(obj);
      // console.log('sent a message from the child!');
      // self.close();

      // TODO: send message (will this message include the JSON version of the net? probably)
      // TODO: write net to file
      // TODO: self.close after some time
        // Post MVP: set that time to be dependent on the size of the net
      }
    });

  var currentPath = message.pathToData;
  var readStream = fs.createReadStream(currentPath, {encoding:'utf8'});
  readStream = byline(readStream);
  readStream.on('data', function(data) {
    // console.log('one line of data in readStream is:',JSON.parse(data));
    trainStream.write(JSON.parse(data));
    // TODO: can we just do a pipe? 
    // TODO: might have to be a transformStream if we really need to parse.
  });
  // readStream.pipe(trainStream, {end: false});
  readStream.on('end', function() {
    // TODO: can we just add a null at the end of our file? 
    console.log('finished our first iteration');
    trainStream.write(null);
  });
  // TODO: run bestNetChecker

});