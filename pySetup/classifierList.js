var argv = global.argv;

/*
classifier summary descriptions
'clRfEntropy', randomForest using the entropy criterion 
'clRfGini', randomForest using the Gini criterion
'clSVCFirst',  first SVC. SVC models train in quadratic time, and should only be used on datasets with fewer than a few tens of thousands of 
'clSVCShrinking'  sets the shrinking parameter equal to true. SVC models train in quadratic time, and should only be used on datasets with han a few tens of thousands of rows 
'clnnSknn' scikit-neuralnetwork's wrapper around pyLearn2's neueral network. this is designed to be compatible with scikit-learn. It had very active development through mid 2015, but does not appear to be supported since then. 

*/

module.exports = {
  dev: {
    // clSVCFirst: 'clSVCFirst',
    // clSVCShrinking: 'clSVCShrinking',
    // clRfEntropy: 'clRfEntropy',
    // clRfGini: 'clRfGini',
    clnnSknn3Layer: 'clnnSknn3Layer',
    clnnSknn: 'clnnSknn'
  },
  shortDataSet: {
    clnnSknn3Layer: 'clnnSknn3Layer',
    clnnSknn: 'clnnSknn',
    clRfEntropy: 'clRfEntropy',
    clRfGini: 'clRfGini', 
    clSVCFirst: 'clSVCFirst',
    clSVCShrinking: 'clSVCShrinking'
  },
  longDataSet: {
    clnnSknn3Layer: 'clnnSknn3Layer',
    clnnSknn: 'clnnSknn',
    clRfEntropy: 'clRfEntropy',
    clRfGini: 'clRfGini'
  }
};
