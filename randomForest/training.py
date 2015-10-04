# MVP2: listen for communication coming in from parent process in node

'''
next steps:
    3. determine which parameters we want to mess with
        https://www.kaggle.com/forums/f/15/kaggle-forum/t/4092/how-to-tune-rf-parameters-in-practice
        A. M-Try (number of features it tries at each decision point in a tree). Starts at square root of features available, but tweak it up and down by a few (probably no more than 3 in each direction; it seems even 1 or 2 is enough)
        B. Number of folds for cross-validation: 10 is what most people use, but more gives you better accuracy (likely at the cost of compute time). again, returns are pretty rapidly diminishing. 
        C. platt scaling of the results to increase overall accuracy at the cost of outliers (which sounds perfect for an ensemble)
        D. preprocessing the data might help- FUTURE
        E. Principle Component Analysis to decrease dependence between features
        F. Number of trees
        G. Possibly ensemble different random forests together. this is where the creative ensembling comes into play!
        H. Splitting criteria
        I. AdaBoost
        J. Can bump up nodesize as much as possible to decrease training time (split)
            consider doing this first, finding what node size we finally start decreasing accuracy on, then use that node size for the rest of the testing we do, then possibly bumping it down a bit again at the end. 
                https://www.kaggle.com/c/the-analytics-edge-mit-15-071x/forums/t/7890/node-size-in-random-forest
        K. min_samples_leaf- smaller leaf makes you more prone to capturing noise from the training data. Try for at least 50??
            http://www.analyticsvidhya.com/blog/2015/06/tuning-random-forest-model/
        L. random_state: adds reliability. Would be a good one to split on if ensembling different RFs together. 
        M. oob_score: something about intelligent cross-validation. 
        N. allusions to regularization, or what I think they mean- feature selection. 
    4. create lists of the parameter combinations we want to try

    5. test those combos!
        At the end of the test, run the best combo with 1000 trees (or some large number of trees), since more trees almost always increases accuracy
    6. make sure we are properly sending messages from the child to the parent
    7. build out the logic for the parent on what to do when it receives various messages from it's children
    8. make sure we are writing the trained rf to a file
    9. open up a predicting child_process, load the trained rf into that process from file, make predictions on all the items in the testing dataset
    10. aggregate results together!
        10A. heck, for kaggle purposes, the easiest way to do this is probably just to have each trained classifier run through the whole dataset on it's own, writing it's prediction for each one to a file. this prevents us from having to run a different asynch function for each classifier for each row, which means we need to worry about rate-limiting, being limited by the slowest-running classifier, and the fact that sending messages is generally a synchronous event. 
            we could also then have all the collected raw data available for easy testing (testing of different aggregation methods, testing of model accuracy, etc.)


'''
    
import sys
import csv
import json
import math
import os
import time
import cPickle as pickle
from sklearn.cross_validation import train_test_split
from sklearn.grid_search import GridSearchCV
from sklearn.metrics import classification_report
from sklearn.ensemble import RandomForestClassifier

def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)


X = []
y = []

fileName = os.path.split(sys.argv[1])[1]
inputFilePath = sys.argv[1]

# find the path to this file we're currently writing code in, and create a file in that directory that appends 'y' to the filename the user gave us
y_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'y_train' + fileName)
X_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'X_train2' + fileName)

with open(X_file_name, 'rU') as openInputFile:
    inputRows = csv.reader(openInputFile)
    for row in inputRows:
        # for value in row:
        #     if value == 'nan'

        X.append(row)


with open(y_file_name, 'rU') as openOutputFile:
    outputRows = csv.reader(openOutputFile)
    for row in outputRows:
        try:
            row[0] = float(row[0])
        except:
            row[0] = row[0]
        y.append(row[0])

# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=0)

rf = RandomForestClassifier(n_estimators=15, n_jobs=-1)

sqrtNum = int(math.sqrt(len(X[0])))

max_features_to_try = [sqrtNum + x for x in (-2,0,2)]
max_features_to_try.append('log2')
max_features_to_try.append(None)


parameters_to_try = {
    'criterion': ['gini','entropy'],
    'max_features': max_features_to_try,
    'min_samples_leaf':[1,2,5]
}

printParent('we are about to run a grid search over the following space:')
printParent(parameters_to_try)

clf = GridSearchCV(rf, parameters_to_try, cv=10, n_jobs=-1)

printParent('right before clf.fit')

# clf.fit(X_train, y_train)
clf.fit(X, y)

printParent('we have used grid search to explore the entire parameter space and find the best possible version of a random forest for your particular data set!')

printParent('*********************************************************************************************************')
printParent("this estimator's best prediction is:")
printParent(clf.best_score_)
printParent('*********************************************************************************************************')
printParent("this estimator's best parameters are:")
printParent(clf.best_params_)
printParent('now that we have figured this out, we are going to train a random forest with considerably more trees. more trees means a better fit, but they also take significantly longer to train, so we kept the number of trees relatively low while searching through the parameter space to make sure you were not stuck here until python6 comes out.')


time.sleep(2)

bigRF = RandomForestClassifier(n_estimators=1500, n_jobs=-2)
bigRF.set_params(criterion=clf.best_params_['criterion'])
try:
    bigRF.set_params(max_features=clf.best_params_['max_features'])
except:
    None
    
try:
    bigRF.set_params(min_samples_leaf=clf.best_params_['min_samples_leaf'])
except:
    None

bigRF.fit(X, y)
printParent('we have trained an even more powerful random forest!')

bigRFscore = bigRF.score(X, y)
printParent('the bigger randomForest has a score of')
printParent(bigRFscore)

pickle.dump(bigRF, open('randomForest/bestRF.p', 'w+'))

# pickle.dump(clf.best_estimator_, open('randomForest/bestRF.p', 'w+'))
printParent('wrote the best estimator to a file')
