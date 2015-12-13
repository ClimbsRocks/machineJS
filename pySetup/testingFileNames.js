// right now, machineJS is designed to console.log the list of fileNames 
// if you copy/paste them in here, you can add in the --alreadyFormatted flag
// this will allow you to skip over repeating the data-formatter part of the process if you've already run it
// make sure you name your new object after the training data set you passed in
// right now, that name can be found as the last word after the "_" before the ".npz" file extension
// if you look at the examples below, you can look at the property name of each object, find where in each file name that property name resides, and then grab the same part of the file name for your files as your own property name. 

module.exports = {

  rossmantrain: { 
    idHeader: 'Id',
    outputHeader: 'sales',
    id_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_rossmantrain.npz',
    y_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_rossmantrain.npz',
    id_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_test_rossmantestrossmantrain.npz',
    X_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_rossmantestrossmantrain.npz',
    X_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_rossmantrain.npz',
    X_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_rossmantrain.npz',
    y_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_rossmantrain.npz',
    X_test_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_nn_rossmantestrossmantrain.npz',
    testingDataLength: 41088,
    trainingDataLength: 1017209,
    problemType: 'regression' 
  },

  numerai_training_data_tournament: {
    idHeader: "t_id",
    outputHeader: "target",
    id_train: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_train_numerai_training_data_tournament.npz",
    y_train: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_numerai_training_data_tournament.npz",
    id_test: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/id_test_numerai_tournament_datanumerai_training_data_tournament.npz",
    X_test: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_numerai_tournament_datanumerai_training_data_tournament.npz",
    X_train: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_numerai_training_data_tournament.npz",
    X_train_nn: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_train_nn_numerai_training_data_tournament.npz",
    y_train_nn: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/y_train_nn_numerai_training_data_tournament.npz",
    X_test_nn: "/Users/preston/ghLocal/machineLearningWork/machineJS/pySetup/data-formatterResults/X_test_nn_numerai_tournament_datanumerai_training_data_tournament.npz",
    testingDataLength: 19461,
    trainingDataLength: 55038,
    problemType: "category"
  },

  homesitetrain: { 
    idHeader: 'quotenumber',
    outputHeader: 'quoteconversion_flag',
    id_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/id_train_homesitetrain.npz',
    y_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/y_train_homesitetrain.npz',
    id_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/id_test_homesitetesthomesitetrain.npz',
    X_test: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/X_test_homesitetesthomesitetrain.npz',
    X_train: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/X_train_homesitetrain.npz',
    X_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/X_train_nn_homesitetrain.npz',
    y_train_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/y_train_nn_homesitetrain.npz',
    X_test_nn: '/Users/preston/ghLocal/machineLearningWork/machineJS/node_modules/ensembler/node_modules/machinejs/pySetup/data-formatterResults/X_test_nn_homesitetesthomesitetrain.npz',
    testingDataLength: 173836,
    trainingDataLength: 260753,
    problemType: 'category' 
  }

};

