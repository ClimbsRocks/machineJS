var argv = global.argv;

if(argv.dev || argv.devKaggle) {
  module.exports = {
    // clSVCFirst: 'clSVCFirst',
    // clSVCShrinking: 'clSVCShrinking',
    // clRfEntropy: 'clRfEntropy',
    clRfGini: 'clRfGini'
  };

} else {
  module.exports = {
    clRfEntropy: 'clRfEntropy', /*randomForest using the entropy criterion */
    clRfGini: 'clRfGini' /*randomForest using the Gini criterion*/
    // clSVCFirst: 'clSVCFirst', /* first SVC */
    // clSVCShrinking: 'clSVCShrinking' /* sets the shrinking parameter equal to true */
  };
  
}
