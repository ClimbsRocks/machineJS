import sys
import csv
import os
import os.path as path
import json
import joblib
import logging
import time

import numpy as np
from sklearn.cross_validation import train_test_split
from sklearn.grid_search import GridSearchCV, RandomizedSearchCV
from scipy.sparse import csr_matrix, vstack

from sendMessages import printParent
from sendMessages import messageParent
from sendMessages import obviousPrint

logging.basicConfig()

import warnings
startTime = time.time()

from randomizedSearchList import rsList
randomizedSearchCVList = rsList()

# these lines will give us an object with keys for each classifier name, and values that will return classifiers to us. 
from makeClassifiers import makeClassifiers
globalArgs = json.loads(sys.argv[2])
fileNames = json.loads(sys.argv[3])

classifierName = sys.argv[4]
problemType = sys.argv[5]

sys.path.append(globalArgs['ppCompleteLocation'] + '/pySetup/parameterMakers')
import paramMakers

import makeBigClassifiers
import extendedTrainingList

dev = False
if( globalArgs['dev'] ):
    dev = True

def load_sparse_csr(filename):
    loader = np.load(filename)
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 


classifierCreater = makeClassifiers(globalArgs, dev, problemType)

X = []
y = []
headerRow = []

# for neural networks, we need to train on data normalized to the range of {0,1} or {-1,1}
# data-formatter did that for us already, so we just have to load in the correct feature data
if( classifierName[0:4] == 'clnn' ):
    X_file_name = fileNames['X_train_nntrainingData']
else:    
    X_file_name = fileNames['X_traintrainingData']

# for neural networks, the y values to not need to be normalized
y_file_name = fileNames['y_traintrainingData']

try:
    
    X = load_sparse_csr(X_file_name)

# the following block works for dense arrays
except:
    # our X_train file has a header row, so the user can see the results of data-formatter in a pretty way if they'd like.
    # we need to remove this row form our actual dataset
    # none of our other files from data-formatter have header rows
    with open(X_file_name, 'rU') as openInputFile:
        inputRows = csv.reader(openInputFile)
        firstRow=False
        for row in inputRows:
            if(firstRow):
                rowAsFloats = []
                # make sure that floats that were saved as scientific notation are actually read in as floats
                # this should be non-controversial, as by this point we should have turned all categorical data into binary representation (0 or 1).
                for idx, val in enumerate(row):
                    try:
                        val = float(val)
                    except:
                        printParent(headerRow[idx])
                        printParent(val)
                    rowAsFloats.append( val )
                X.append(row)
            else:
                headerRow = row
                firstRow=True
            

    X = np.array(X)

try:
    y = load_sparse_csr(y_file_name)

except:
    # supports dense input
    with open(y_file_name, 'rU') as openOutputFile:
        outputRows = csv.reader(openOutputFile)
        # this might be unnecessary now that we have run our data through data-formatter
        # we might be able to load in the y_train data directly
        firstRow = False
        for row in outputRows:
            if firstRow:
                try:
                    row[0] = float(row[0])
                except:
                    row[0] = row[0]
                y.append(row[0])
            else:
                # ignore the first row as it holds our header
                firstRow = True
    y = np.array(y)

try:
    if y.shape[0] == 1:
        y = y.todense().tolist()[0]
except:
    pass

# we have already separated out our validation data (currently 20% of the entire training data set by default)
# the data that we have loaded in here is the 80% that is not our validation data
# we want to have 30% of our entire training data set used as our "search" data set, meaning it is 37.5% of this 80% data set
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.625, random_state=0)

# if we're developing, train on only a small percentage of the dataset, and do not train the final large classifier (where we significantly bump up the number of estimators).
if dev:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.99, random_state=0)

# instantiate a new classifier, given the type passed in to us
classifier = classifierCreater[classifierName]

# XGBoost requires data to be in it's own particular format. 
if classifierName == 'clXGBoost':
    try:
        X_train = classifier.DMatrix( X_train )
        X = classifier.DMatrix( X )
    except:
        pass


# create features that are custom to the size of the input data. 
# Each individual paramaterMaker file sits in the paramaterMakers folder. If you want to modify what the parameters are, or submit a PR with a better combination of parameters to try, that is the place to start. 
allParams = paramMakers.makeAll(X,y,globalArgs, dev, problemType)
parameters_to_try = allParams[classifierName]

printParent('we are about to run a cross-validated search for the best hyperparameters for ' + classifierName)


try:
    if randomizedSearchCVList[classifierName]:
        # error_score=0 means that if some combinations of parameters fail to train properly, the rest of the grid search process will work.
        # numIterationsPerRound defaults to 10, unless the user has passed in a more specific value.
        searchCV = RandomizedSearchCV(classifier, parameters_to_try, n_jobs=globalArgs['numCPUs'], error_score=0, n_iter=globalArgs['numIterationsPerRound'])
    else:
        # error_score=0 means that if some combinations of parameters fail to train properly, the rest of the grid search process will work
        searchCV = GridSearchCV(classifier, parameters_to_try, n_jobs=globalArgs['numCPUs'], error_score=0)
except:
        # error_score=0 means that if some combinations of parameters fail to train properly, the rest of the grid search process will work
        searchCV = GridSearchCV(classifier, parameters_to_try, n_jobs=globalArgs['numCPUs'], error_score=0)    


if classifierName[0:4] == 'clnn':
    X = X.todense()
    obviousPrint('X.shape',X.shape)
    y = np.array(y)
    obviousPrint('y.shape before gridsearch',y.shape)

searchCV.fit(X_train, y_train ) 
printParent('\n')
printParent('*********************************************************************************************************')
printParent(classifierName + "'s best score from the hyperparameter search attempts is:")
printParent(searchCV.best_score_)
printParent('*********************************************************************************************************')
printParent(classifierName + "'s best parameters this time are:")
printParent(searchCV.best_params_)
printParent('\n')

printParent(classifierName + "'s total hyperparameter searching time is:")
# this will give time in minutes, to one decimal point
finishTrainTime = time.time()
printParent( round((finishTrainTime - startTime)/60, 1) )

# TODO: send over bestSearchScore
longTrainThreshold = argv['bestSearchScore'] * globalArgs['longTrainThreshold']
messageObj = {
    "searchScore": searchCV.best_score_,
    "algoName": classifierName
}

# only put in the (oftentimes considerable) effort of longTraining this algorithm if it meets the threshold defined by longTrainThreshold
if searchCV.best_score_ > longTrainThreshold:
    # Get info on whether this algo supports creating a larger version of that classifier. 
    # for example, a random forest you can train with more trees, a neural network you can train for more epochs, etc.
    extendedTraining = extendedTrainingList.getAll()[classifierName]

    if extendedTraining:
        allBigClassifiers = makeBigClassifiers.makeAll(globalArgs, dev, problemType)
        longTrainClassifier = allBigClassifiers[classifierName]

    # otherwise, just create a new classifier
    # we could possibly warmStart from the GridSearch version, but given that we have more than doubled the size of our dataset, I think we'd have the best luck starting from scratch
    else:
        longTrainClassifier = classifierCreater[classifierName]
        
    longTrainClassifier.set_params(**searchCV.best_params_)


    if classifierName[0:4] == 'clnn':
        X = X.todense()
        obviousPrint('X.shape right before long training in training.py',X.shape)
        y = np.array(y)
        obviousPrint('y.shape right before long training in training.py',y.shape)

    startLongTrainTime = time.time()

    longTrainClassifier.fit(X, y)

    finishLongTrainTime = time.time()
    printParent(classifierName + "'s training on the longer data set took:")
    printParent( round((finishLongTrainTime - startLongTrainTime)/60, 1) )


    longTrainClassifierScore = longTrainClassifier.score(X, y)
    printParent(classifierName + "'s score against the larger training data set is:")
    printParent(longTrainClassifierScore)
    messageObj['longTrainScore'] = longTrainClassifierScore


    classifierFolder = path.join(globalArgs['bestClassifiersFolder'], 'best' + classifierName)
    if not os.path.exists(classifierFolder):
        os.makedirs(classifierFolder)
    joblib.dump(longTrainClassifier,  path.join(classifierFolder, 'best' + classifierName + '.pkl') )

else:
    messageObj['longTrainScore'] = 0

# TODO: collect trainingResults, and process them
messageParent(messageObj, 'trainingResults')
