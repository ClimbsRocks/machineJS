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
    X_file_name = fileNames['X_train_nnsearchData']
    X_file_nameLongTraining = fileNames['X_train_nnlongTrainingData']
else:    
    X_file_name = fileNames['X_trainsearchData']
    X_file_nameLongTraining = fileNames['X_trainlongTrainingData']

# for neural networks, the y values to not need to be normalized
y_file_name = fileNames['y_trainsearchData']
y_file_nameLongTraining = fileNames['y_trainlongTrainingData']

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

# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=0)

# if we're developing, train on only a small percentage of the dataset, and do not train the final large classifier (where we significantly bump up the number of estimators).
# if dev:
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.99, random_state=0)
#         # extendedTraining = False

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

try:
    printParent('we are about to run a grid search over the following space:')
    printParent(parameters_to_try)
    printParent(classifierName)
except:
    printParent('we are about to run a Randomized Search for the following algorithm:')
    printParent(classifierName)


try:
    if randomizedSearchCVList[classifierName]:
        searchCV = RandomizedSearchCV(classifier, parameters_to_try, n_jobs=globalArgs['numCPUs'], error_score=0, n_iter=40)
    else:
        # error_score=0 means that if some combinations of parameters fail to train properly, the rest of the grid search process will work
        searchCV = GridSearchCV(classifier, parameters_to_try, n_jobs=globalArgs['numCPUs'], error_score=0)
except:
        # error_score=0 means that if some combinations of parameters fail to train properly, the rest of the grid search process will work
        searchCV = GridSearchCV(classifier, parameters_to_try, n_jobs=globalArgs['numCPUs'], error_score=0)


def load_sparse_csr_logging(filename):
    loader = np.load(filename)
    # obviousPrint("loader['indices']",loader['indices'])
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 

# if classifierName[0:4] == 'clnn':
#     y = load_sparse_csr_logging(fileNames['y_train_nnsearchData'])
    
if y.shape[0] == 1:
    y = y.todense().tolist()[0]
    # y = np.ravel(y)
    # obviousPrint('y.shape',y.shape)
    # y = zip(*y)
    # y = np.ravel(y)


if classifierName[0:4] == 'clnn':
    X = X.todense()
    obviousPrint('X.shape',X.shape)
    y = np.array(y)
    obviousPrint('y.shape before gridsearch',y.shape)
    # printParent(y.tolist())
    # obviousPrint('len(X)',len(X))
    # obviousPrint('len(X[0])',len(X[0]))

searchCV.fit(X, y ) 
printParent('\n')
printParent('*********************************************************************************************************')
printParent("this estimator's best prediction is:")
printParent(searchCV.best_score_)
printParent('*********************************************************************************************************')
printParent("this estimator's best parameters are:")
printParent(searchCV.best_params_)
printParent('\n')

printParent('total training time for this classifier:')
# this will give time in minutes
finishTrainTime = time.time()
printParent( round((finishTrainTime - startTime)/60, 1) )

# TODO: Get info on whether this algo supports creating a larger version of that classifier. 
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

    # if dev:
    #     bigClassifier.fit(X_train, y_train)
    # else: 
    #     # note: we are testing grid search on 50% of the data (X_train and y_train), but fitting bigClassifier on the entire dataset (X,y)

# now we train on the entire training data set, minus the validation data
xLongData = load_sparse_csr(X_file_nameLongTraining)

yLongData = load_sparse_csr(y_file_nameLongTraining)

# handles cases where y is a single column, else multiple columns
if yLongData.shape[0] == 1:
    yLongData = yLongData.todense().tolist()[0]
    # yLongData = zip(*yLongData)
    # yLongData = np.ravel(yLongData)
    y = np.concatenate( (y, yLongData), axis=0 )

else:
    y = vstack( [y, yLongData] )

X = vstack( [X, xLongData] )

if classifierName[0:4] == 'clnn':
    X = X.todense()
    obviousPrint('X.shape right before long training in training.py',X.shape)
    y = np.array(y)
    obviousPrint('y.shape right before long training in training.py',y.shape)

longTrainClassifier.fit(X, y)


longTrainClassifierScore = longTrainClassifier.score(X, y)
printParent('the algorithm that we trained on a larger portion of the dataset has a score of')
printParent(longTrainClassifierScore)


classifierFolder = path.join(globalArgs['bestClassifiersFolder'], 'best' + classifierName)
if not os.path.exists(classifierFolder):
    os.makedirs(classifierFolder)
joblib.dump(longTrainClassifier,  path.join(classifierFolder, 'best' + classifierName + '.pkl') )

messageParent(longTrainClassifierScore, 'trainingResults')
