// TODO: graph the error rates! 
  // on each iteration, push the error rate into an array for that net. 
  // then, simply go through and graph them all. 
  // over time, we can build in a nice dashboard (select the num of hidden layers, select the num of nodes per hidden layer, etc.)
  // goal: to see if there's much of a difference between the different nets
    // to see if we should keep training the nets for longer
    // to see if we should have killed off training a certain net even more quickly
    // because it's cool :) and it will give the user something to look at while their nets are training. it's a good status update. 

// TODO: nest most console logs inside a check for --dev (or --verbose?)
// TODO: build out --devKaggle

// from createChild:
  // TODO: this might be the only place we need to make a change between streaming and passing in the whole dataset
  // FUTURE: see if we can increase the max memory size for each child process, as we would with node "--max-old-space-size= 4000" to signify a ~4GB RAM limit. 
    // NOTE: different computers handle that command as either bytes or megabytes. be careful. 


// FUTURE: stop training once the deltas between iterations have decreased to be only x% of what they were for the first three iterations. 
  // say the error for the first three iterations decreases from .065 to .055, that would be a delta of -.010. That means an average delta of roughly -.003 for each of those iterations.
  // as soon as we reach a point where each training iteration is only giving us a delta of, say, one tenth of that, or -.0003, we stop the training, basically saying it's inefficient. 
  // The great part about this is that it's all relative. So we wouldn't hold a net with a training rate of .3 to the same absolute standard as a net with a trainingRate of .9. 


      //TODO: send over a better message to utils.bestNetChecker. 


      // Or maybe we don't have to kill it, we can just send it new information to train on?!
