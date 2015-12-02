var argv = global.argv;

/*
classifier summary descriptions
'clRfEntropy', randomForest using the entropy criterion 
'clRfGini', randomForest using the Gini criterion
'clSVCFirst',  first SVC. SVC models train in quadratic time, and should only be used on datasets with fewer than a few tens of thousands of 
'clSVCShrinking'  sets the shrinking parameter equal to true. SVC models train in quadratic time, and should only be used on datasets with han a few tens of thousands of rows 
'clnnSknn' scikit-neuralnetwork's wrapper around pyLearn2's neueral network. this is designed to be compatible with scikit-learn. It had very active development through mid 2015, but does not appear to be supported since then. 
'clKnn': k-nearest-neighbors. a relatively different way of approaching the problem
'clLogisticRegression': standard logistic regression. right now though it is trying to cast from float(64) to S(32), and choking on that, so it is commented out for future development at some later point in time. 
'clAdaBoost': trains multiple classifiers, where each additional classifier focuses on the difficult test cases for the previous one.
*/

module.exports = function(problemType, dataLength) {
  // these algorithms work for all problemTypes and dataLengths we have encountered so far
  var universalAlgorithms = {
    clRfGini: 'clRfGini',
    clXGBoost: 'clXGBoost',
    clRfBootstrapTrue: 'clRfBootstrapTrue',
    clAdaBoost: 'clAdaBoost',
  };

  // these algorithms only work on classification problems, due to being instantiated with classification-specific parameters 
  var classifierOnlyAlgorithms = {
    clnnSknn: 'clnnSknn',
    clnnSknn3Layer: 'clnnSknn3Layer',
    clLogisticRegression: 'clLogisticRegression',
    clRfEntropy: 'clRfEntropy'
  }

  var regressionOnlyAlgorithms = {
    clAdaLossLinear: 'clAdaLossLinear',
    clAdaLossSquare: 'clAdaLossSquare',
    clAdaLossExponential: 'clAdaLossExponential'
  }

  // these algorithms have a time coplexity that is prohibitive for long data sets
  var delForLongDatasets = {    
    clSVCFirst: 'clSVCFirst',
    clSVCShrinking: 'clSVCShrinking'
  };

  // these algorithms just aren't working right now for one reason or another
  var brokenRegressionAlgorithms = {
    clnnSknn: 'clnnSknn',
    clnnSknn3Layer: 'clnnSknn3Layer',
    clKnn: 'clKnn',
  };

  var brokenClassifierAlgorithms = {
    clKnn: 'clKnn'

  };

  // these are algorithms we are in the process of implementing now or shortly
  var notImplementedYetAlgorithms = {
    clnnNoLearn: 'clnnNoLearn',
    clLinearRegression: 'clLinearRegression',
    clLinearSVC: 'clLinearSVC'
  }

  // this entire next section is dedicated to extending the universalAlgorithms object, which we will eventually return

  if( problemType === 'category' ) {
    for(var key in classifierOnlyAlgorithms) {
      universalAlgorithms[key] = classifierOnlyAlgorithms[key];
    }
  } else if(problemType === 'regression') {
    for(var key in regressionOnlyAlgorithms) {
      universalAlgorithms[key] = regressionOnlyAlgorithms[key];
    }    
  } else {
    console.error('we heard a problemType, ' + problemType + ', that is not currently supported.');
  }

  if( dataLength === 'longDataSet' ) {
    for( var key in delForLongDatasets ) {
      delete universalAlgorithms[key];
    }
  }

  return universalAlgorithms;

}

module.exports = {
  dev: {
    clRfGini: 'clRfGini',
    clXGBoost: 'clXGBoost',
    clRfBootstrapTrue: 'clRfBootstrapTrue'
  },
  shortDataSet: {
    clXGBoost: 'clXGBoost',
    clRfEntropy: 'clRfEntropy',
    clAdaBoost: 'clAdaBoost',
    clRfGini: 'clRfGini', 
    // clLogisticRegression: 'clLogisticRegression'
  },
  longDataSet: {
    // clSVCFirst: 'clSVCFirst',
    // clSVCShrinking: 'clSVCShrinking',
    // clnnNoLearn: 'clnnNoLearn',
    // clnnSknn3Layer: 'clnnSknn3Layer',
    // clnnSknn: 'clnnSknn',
    // clKnn: 'clKnn',
    // clRfEntropy: 'clRfEntropy',
    clLogisticRegression: 'clLogisticRegression',
    clAdaBoost: 'clAdaBoost',
    // clAdaLossLinear: 'clAdaLossLinear',
    // clAdaLossSquare: 'clAdaLossSquare',
    // clAdaLossExponential: 'clAdaLossExponential',
    clRfGini: 'clRfGini',
    clXGBoost: 'clXGBoost',
    clRfBootstrapTrue: 'clRfBootstrapTrue'
  }
};
