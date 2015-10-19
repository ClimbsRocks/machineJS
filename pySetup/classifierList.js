var argv = global.argv;

if(argv.dev || argv.devKaggle) {
  module.exports = {
    // clSVCFirst: 'clSVCFirst',
    // clSVCShrinking: 'clSVCShrinking',
    // clRfEntropy: 'clRfEntropy',
    // clRfGini: 'clRfGini',
    clnnSknn: 'clnnSknn'
  };

} else {
  module.exports = {
    clRfEntropy: 'clRfEntropy', /*randomForest using the entropy criterion */
    clRfGini: 'clRfGini', /*randomForest using the Gini criterion*/
    // clSVCFirst: 'clSVCFirst', /* first SVC. SVC models train in quadratic time, and should only be used on datasets with fewer than a few tens of thousands of rows*/
    // clSVCShrinking: 'clSVCShrinking' /* sets the shrinking parameter equal to true. SVC models train in quadratic time, and should only be used on datasets with fewer than a few tens of thousands of rows */
    clnnSknn: 'clnnSknn' /*scikit-neuralnetwork's wrapper around pyLearn2's neueral network. this is designed to be compatible with scikit-learn. It had very active development through mid 2015, but does not appear to be supported since then. */
  };
  
}
