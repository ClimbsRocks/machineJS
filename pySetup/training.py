import sys
import csv
import math
import os
import time
import json
import joblib
import logging

import numpy as np
from sklearn.cross_validation import train_test_split
from sklearn.grid_search import GridSearchCV
from sklearn.metrics import classification_report
from sklearn.ensemble import RandomForestClassifier

from sendMessages import printParent
from sendMessages import messageParent
from sendMessages import obviousPrint

logging.basicConfig()

# these three lines will give us an object with keys for each classifier name, and values that will return classifiers to us. 
from makeClassifiers import makeClassifiers
globalArgs = json.loads(sys.argv[2])
fileNames = json.loads(sys.argv[3])

classifierName = sys.argv[4]
sys.path.append(globalArgs['ppCompleteLocation'] + '/pySetup/parameterMakers')
import paramMakers

import makeBigClassifiers
import extendedTrainingList

dev = False
if( globalArgs['dev'] ):
    dev = True

classifierCreater = makeClassifiers(globalArgs, dev)

X = []
y = []
headerRow = []

# for neural networks, we need to train on data normalized to the range of {0,1} or {-1,1}
# data-formatter did that for us already, so we just have to load in the correct feature data
if( classifierName[0:4] == 'clnn' ):
    X_file_name = fileNames['X_train_nn']
else:    
    X_file_name = fileNames['X_train']

# for neural networks, the y values to not need to be normalized
y_file_name = fileNames['y_train']

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

X = np.array(X)
y = np.array(y)


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)

# if we're developing, train on only 1% of the dataset, and do not train the final large classifier (where we significantly bump up the number of estimators).
if dev:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.97, random_state=0)
        # extendedTraining = False

# instantiate a new classifier, given the type passed in to us
classifier = classifierCreater[classifierName]

# create features that are custom to the size of the input data. 
# Each individual paramaterMaker file sits in the paramaterMakers folder. If you want to modify what the parameters are, or submit a PR with a better combination of parameters to try, that is the place to start. 
allParams = paramMakers.makeAll(X,y,globalArgs, dev)
parameters_to_try = allParams[classifierName]


printParent('we are about to run a grid search over the following space:')
printParent(parameters_to_try)

gridSearch = GridSearchCV(classifier, parameters_to_try, cv=5, n_jobs=-1)

gridSearch.fit(X_train, y_train)
printParent('\n')
printParent('*********************************************************************************************************')
printParent("this estimator's best prediction is:")
printParent(gridSearch.best_score_)
printParent('*********************************************************************************************************')
printParent("this estimator's best parameters are:")
printParent(gridSearch.best_params_)
printParent('\n')

# TODO: Get info on whether this algo supports extended training from some global module. 
extendedTraining = extendedTrainingList.getAll()[classifierName]

if extendedTraining:
    # create a dict with mappings from algo name ('clRandomForest') to a function that will return a newly instantiated version of that algo (with the proper n_estimators and other custom parameters for that classifier)
    allBigClassifiers = makeBigClassifiers.makeAll(globalArgs, dev)
    bigClassifier = allBigClassifiers[classifierName]
    bigClassifier.set_params(**gridSearch.best_params_)
    # obviousPrint('bigClassifier params:',bigClassifier.get_params())

    if dev:
        bigClassifier.fit(X_train, y_train)
    else: 
        # note: we are testing grid search on 50% of the data (X_train and y_train), but fitting bigClassifier on the entire dataset (X,y)
        bigClassifier.fit(X, y)

    bigClassifierscore = bigClassifier.score(X, y)
    printParent('the bigger randomForest has a score of')
    printParent(bigClassifierscore)

    
    if not os.path.exists('pySetup/bestClassifiers/best' + classifierName):
        os.makedirs('pySetup/bestClassifiers/best' + classifierName)
    joblib.dump(bigClassifier, 'pySetup/bestClassifiers/best' + classifierName + '/best' + classifierName + '.pkl')

else:
    if not os.path.exists('pySetup/bestClassifiers/best' + classifierName):
        os.makedirs('pySetup/bestClassifiers/best' + classifierName)
    joblib.dump(gridSearch.best_estimator_, 'pySetup/bestClassifiers/best' + classifierName + '/best' + classifierName + '.pkl')
