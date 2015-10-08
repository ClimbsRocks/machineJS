var argv = global.argv;

if(argv.dev || argv.devKaggle) {
  module.exports = {
    // clRfEntropy: 'clRfEntropy',
    // clRfGini: 'clRfGini', 
    clSVCFirst: 'clSVCFirst',
    clSVCShrinking: 'clSVCShrinking'
  };

} else {
  module.exports = {
    clRfEntropy: 'clRfEntropy', /*randomForest using the entropy criterion */
    clRfGini: 'clRfGini', /*randomForest using the Gini criterion*/
    clSVCFirst: 'clSVCFirst', /* first SVC */
    clSVCShrinking: 'clSVCShrinking' /* sets the shrinking parameter equal to true */
  };
  
}
