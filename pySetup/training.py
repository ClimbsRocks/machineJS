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
extendedTraining=True
for key in globalArgs:
    if key in( 'devKaggle', 'dev'): 
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.99, random_state=0)
        extendedTraining = False


# instantiate a new classifier, given the type passed in to us
classifier = classifierCreater[classifierName]

# create features that are custom to the size of the input data. 
# this will definitely have to be done individually. 
# i don't see any harm in making each of these into their own file, because aside from the dev check, everything here will be custom to each classifier. 
allParams = paramMakers.makeAll(X,y,globalArgs)
parameters_to_try = allParams[classifierName]


# here is where we start to do very similar things all over again. everything from here forwards can be generalized. 
printParent('we are about to run a grid search over the following space:')
printParent(parameters_to_try)

gridSearch = GridSearchCV(classifier, parameters_to_try, cv=10, n_jobs=globalArgs['numCPUs'])

gridSearch.fit(X_train, y_train)

printParent('we have used grid search to explore the entire parameter space and find the best possible version of a random forest for your particular data set!')

printParent('*********************************************************************************************************')
printParent("this estimator's best prediction is:")
printParent(gridSearch.best_score_)
printParent('*********************************************************************************************************')
printParent("this estimator's best parameters are:")
printParent(gridSearch.best_params_)
printParent('now that we have figured this out, we are going to train a random forest with considerably more trees. more trees means a better fit, but they also take significantly longer to train, so we kept the number of trees relatively low while searching through the parameter space to make sure you were not stuck here until python6 comes out.')

if extendedTraining:
    # create a dict with mappings from algo name ('clRandomForest') to a function that will return a newly instantiated version of that algo (with the proper n_estimators and other custom parameters for that classifier)
    allBigClassifiers = makeBigClassifiers.makeAll(globalArgs)
    bigClassifier = allBigClassifiers[classifierName]
    bigClassifier.set_params(**gridSearch.best_params_)

    # note: we are testing grid search on 50% of the data (X_train and y_train), but fitting bigClassifier on the entire dataset (X,y)
    bigClassifier.fit(X, y)
    printParent('we have trained an even more powerful random forest!')

    bigClassifierscore = bigClassifier.score(X, y)
    printParent('the bigger randomForest has a score of')
    printParent(bigClassifierscore)

    joblib.dump(bigClassifier, 'pySetup/bestClassifiers/best' + classifierName + '/best' + classifierName + '.pkl')
else:
    joblib.dump(gridSearch.best_estimator_, 'pySetup/bestClassifiers/best' + classifierName + '/best' + classifierName + '.pkl')
printParent('wrote the best estimator to a file')
