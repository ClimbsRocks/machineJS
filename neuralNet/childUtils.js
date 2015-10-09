var nn = global.neuralNetwork;
var child_process = require('child_process');
var argv = global.argv;
var utils = require('./utils.js');
var makeKagglePredictions = require('./makeKagglePredictions.js');

module.exports = {
  allParamsToTest: [],
  createChild: function(extendedTrainingNet) {
    var child_process = require('child_process'); //this is node's built in module for creating new processes. 
    if(argv.useStreams) {
      var child = child_process.fork('./brainChildStream',{cwd: nn.location});
    } else {
      var child = child_process.fork('./brainChildMemoryHog',{cwd: nn.location});
    }

    var messageObj;
    // one time only, once we have determined the best net, we are going to pass the serialized net in as an argument, to pass that onto the child process
    if(extendedTrainingNet) {
      messageObj = utils.makeExtendedTrainingObj();
      
    } else {
      messageObj = utils.makeTrainingObj( module.exports.allParamsToTest.shift() );
    }

    child.send(messageObj);

    var netTrackingObj = {
      hiddenLayers: messageObj.hiddenLayers,
      learningRate: messageObj.trainingObj.learningRate,
      iterations: 0,
      trainingErrorRate: [],
      net: undefined,
      testingErrorRate: Infinity,
      running: true
    };

    if(nn.neuralNetResults[messageObj.brainID] === undefined) {
      nn.neuralNetResults[messageObj.brainID] = netTrackingObj;
    } else if(!extendedTrainingNet) {
      console.log('we already have a net at this property:',messageObj.brainID);
      console.log('other brain info:',messageObj);
    }

    return child;
  },

  attachListeners: function(child) {
    child.running = true;
    child.startTime = Date.now();
    child.on('message', function(message) {
      var id = message.brainID;
      if(message.type === 'finishedTraining') {
        utils.updateNetStatus(message);
        nn.neuralNetResults[id].running = false;
        child.running = false;
        child.endTime = Date.now();
        nn.completedNets++;

        child.kill();
        utils.bestNetChecker(message); 


        console.log('trained', nn.completedNets,'so far,', nn.numOfNetsToTest - nn.completedNets, "still learning everything it can about your dataset in it's quest to be your best neural net ever!");

        if(module.exports.allParamsToTest.length > 0) {
          var newChild = module.exports.createChild();
          module.exports.attachListeners(newChild);
          nn.referencesToChildren.push(newChild);
        } else if (nn.completedNets === nn.numOfNetsToTest) {
          console.log('done training all the neural nets you could conjure up!');
          if(argv.noPython) {
            // if we are not running the python scripts for some reason, just end the training here and make predictions. 
            process.emit('stopTraining');
            makeKagglePredictions( argv.kagglePredict, argv.ppCompleteLocation );
          }
          // this is a flag to warn the user that we're still training some nets if they try to access the results before we're finished
          nn.readyToMakePredictions = true;
          // TODO TODO: load up the bestNet
          var extendedTrainingChild = module.exports.createChild(nn.bestNetObj.trainingBestAsJSON);
          module.exports.attachSpecialListeners(extendedTrainingChild);
            // train it for a longer period of time (10 minutes by default, but let the user specify this eventually)
            // once we have reached that threshold, only then run makeKagglePredictions


          // if(argv.kagglePredict || argv.devKaggle) {
          //   makeKagglePredictions( argv.kagglePredict, argv.ppCompleteLocation );
          // }
        } 
        
      } else if (message.type === 'midTrainingCheckIn'){
        utils.updateNetStatus(message);
        utils.bestNetChecker(message);
      } else {
        console.log('heard a message in parent and did not know what to do with it:',message);
      }
    });
  },

  attachSpecialListeners: function(child) {
    child.running = true;
    child.startTime = Date.now();
    process.on('stopTraining', function() {
      child.kill();
      makeKagglePredictions( argv.kagglePredict, argv.ppCompleteLocation );
    });
    child.on('message', function(message) {
      // just make sure we are writing this to nn.bestNetObj.trainingBestAsJSON
      // we probably accomplish that with utils.bestNetChecker(message);
      var id = message.brainID;
      utils.updateNetStatus(message);
      utils.bestNetChecker(message);

    });
  },

};
