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

module.exports = {
  dev: {
    clnnSknn3Layer: 'clnnSknn3Layer',
    clnnSknn: 'clnnSknn',
    clKnn: 'clKnn',
    clAdaBoost: 'clAdaBoost',
    clXGBoost: 'clXGBoost',
    clRfEntropy: 'clRfEntropy',
    clRfGini: 'clRfGini',
  },
  shortDataSet: {
    clXGBoost: 'clXGBoost',
    clKnn: 'clKnn',
    clRfEntropy: 'clRfEntropy',
    clAdaBoost: 'clAdaBoost',
    clRfGini: 'clRfGini', 
    clSVCFirst: 'clSVCFirst',
    clSVCShrinking: 'clSVCShrinking',
    clnnSknn: 'clnnSknn',
    clnnSknn3Layer: 'clnnSknn3Layer'
    // clLogisticRegression: 'clLogisticRegression'
  },
  longDataSet: {
    clnnSknn3Layer: 'clnnSknn3Layer',
    clnnSknn: 'clnnSknn',
    clKnn: 'clKnn',
    clRfEntropy: 'clRfEntropy',
    clRfGini: 'clRfGini',
    clAdaBoost: 'clAdaBoost',
    // clLogisticRegression: 'clLogisticRegression'
    clXGBoost: 'clXGBoost'
  }
};
