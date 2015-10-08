import sys
import csv
import math
import os
import time
import json
import joblib

from sklearn.cross_validation import train_test_split
from sklearn.grid_search import GridSearchCV
from sklearn.metrics import classification_report
from sklearn.ensemble import RandomForestClassifier

from sendMessages import printParent
from sendMessages import messageParent
from sendMessages import obviousPrint

# these three lines will give us an object with keys for each classifier name, and values that will return classifiers to us. 
from makeClassifiers import makeClassifiers
globalArgs = json.loads(sys.argv[2])
classifierCreater = makeClassifiers(globalArgs)

classifierName = sys.argv[4]
sys.path.append(globalArgs['ppCompleteLocation'] + '/pySetup/parameterMakers')
import paramMakers

import makeBigClassifiers
import extendedTrainingList

dev = False
for key in globalArgs:
    if key in( 'devKaggle', 'dev'): 
        dev = True

X = []
y = []

y_file_name = json.loads(sys.argv[3])['y_train']
X_file_name = json.loads(sys.argv[3])['X_train']

with open(X_file_name, 'rU') as openInputFile:
    inputRows = csv.reader(openInputFile)
    for row in inputRows:
        X.append(row)
        

with open(y_file_name, 'rU') as openOutputFile:
    outputRows = csv.reader(openOutputFile)
    for row in outputRows:
        try:
            row[0] = float(row[0])
        except:
            row[0] = row[0]
        y.append(row[0])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=0)

# if we're developing, train on only 1% of the dataset, and do not train the final large classifier (where we significantly bump up the number of estimators).
if dev:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.99, random_state=0)
        # extendedTraining = False


# instantiate a new classifier, given the type passed in to us
classifier = classifierCreater[classifierName]

# create features that are custom to the size of the input data. 
# Each individual paramaterMaker file sits in the paramaterMakers folder. If you want to modify what the parameters are, or submit a PR with a better combination of parameters to try, that is the place to start. 
allParams = paramMakers.makeAll(X,y,globalArgs, dev)
parameters_to_try = allParams[classifierName]


printParent('we are about to run a grid search over the following space:')
printParent(parameters_to_try)

gridSearch = GridSearchCV(classifier, parameters_to_try, cv=10, n_jobs=globalArgs['numCPUs'])

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
