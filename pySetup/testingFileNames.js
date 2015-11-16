// ******************************************************************************************************************************
// Whenever you uncomment one section, be sure to comment out the other sections
// ******************************************************************************************************************************



// Rossman Short Train Dev Data:
module.exports = { 
  idHeader: 'Id',
  outputHeader: 'sales',
  id_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_rossShortTrainDev.npz',
  y_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_rossShortTrainDev.npz',
  id_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_test_rossmantest.npz',
  X_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_rossmantest.npz',
  X_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_rossShortTrainDev.npz',
  X_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_rossShortTrainDev.npz',
  y_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_rossShortTrainDev.npz',
  X_test_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_nn_rossmantest.npz',
  trainingDataLength: 150333,
  problemType: 'regression'
};

// Rossman full data
// module.exports = { 
//   idHeader: 'Id',
//   outputHeader: 'sales',
//   id_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_tran_filled_gap.npz',
//   y_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_tran_filled_gap.npz',
//   id_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_test_rossmantest.npz',
//   X_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_rossmantest.npz',
//   X_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_tran_filled_gap.npz',
//   X_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_tran_filled_gap.npz',
//   y_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_tran_filled_gap.npz',
//   X_test_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_nn_rossmantest.npz',
//   trainingDataLength: 1050330,
//   problemType: 'regression' 
// };

// Rossman Full Data With splits:
// module.exports = {
//   "idHeader":"Id",
//   "outputHeader":"sales",
//   "id_train":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_tran_filled_gap.npz",
//   "y_train":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_tran_filled_gap.npz",
//   "id_test":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_test_rossmantest.npz",
//   "X_test":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_rossmantest.npz",
//   "X_train":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_tran_filled_gap.npz",
//   "X_train_nn":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_tran_filled_gap.npz",
//   "y_train_nn":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_tran_filled_gap.npz",
//   "X_test_nn":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_nn_rossmantest.npz",
//   "trainingDataLength":1050330,
//   "problemType":"regression",
//   "X_trainlongTrainingData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_tran_filled_gaplongTrainingData.npz",
//   "X_trainsearchData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_tran_filled_gapsearchData.npz",
//   "X_trainvalidationData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_tran_filled_gapvalidationData.npz",
//   "id_trainlongTrainingData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_tran_filled_gaplongTrainingData.npz",
//   "id_trainsearchData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_tran_filled_gapsearchData.npz",
//   "id_trainvalidationData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_tran_filled_gapvalidationData.npz",
//   "y_trainvalidationData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_tran_filled_gapvalidationData.npz",
//   "y_trainsearchData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_tran_filled_gapsearchData.npz",
//   "y_trainlongTrainingData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_tran_filled_gaplongTrainingData.npz",
//   "X_train_nnlongTrainingData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_tran_filled_gaplongTrainingData.npz",
//   "X_train_nnsearchData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_tran_filled_gapsearchData.npz",
//   "X_train_nnvalidationData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_tran_filled_gapvalidationData.npz",
//   "y_train_nnvalidationData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_tran_filled_gapvalidationData.npz",
//   "y_train_nnsearchData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_tran_filled_gapsearchData.npz",
//   "y_train_nnlongTrainingData":"/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_tran_filled_gaplongTrainingData.npz"
// };


// // Rossman Tiny training data
// module.exports = { 
//   idHeader: 'Id',
//   outputHeader: 'sales',
//   id_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_rossTinyTrain.npz',
//   y_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_rossTinyTrain.npz',
//   id_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_test_rossmantest.npz',
//   X_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_rossmantest.npz',
//   X_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_rossTinyTrain.npz',
//   X_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_rossTinyTrain.npz',
//   y_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_rossTinyTrain.npz',
//   X_test_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_nn_rossmantest.npz',
//   trainingDataLength: 10000,
//   problemType: 'regression' 
// };
