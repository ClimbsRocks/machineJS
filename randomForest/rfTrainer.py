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
        J. Can bump up nodesize as much as possible to decrease training time
            consider doing this first, finding what node size we finally start decreasing accuracy on, then use that node size for the rest of the testing we do, then possibly bumping it down a bit again at the end. 
                https://www.kaggle.com/c/the-analytics-edge-mit-15-071x/forums/t/7890/node-size-in-random-forest
        K. min_sample_leaf- smaller leaf makes you more prone to capturing noise from the training data. Try for at least 50??
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
    
from sys import argv
import csv
import json
import math
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

printParent('hello from inside rfTrainer.py');


X = []
y = []

targetDataFileName='/Users/preston/ghLocal/machineLearningWork/ppComplete/randomForest/pythonOutputVectkaggleGiveCredit.csv'
inputDataFileName='/Users/preston/ghLocal/machineLearningWork/ppComplete/randomForest/pythonInputVect2kaggleGiveCredit.csv'

with open(inputDataFileName, 'rU') as openInputFile:
    inputRows = csv.reader(openInputFile)
    for row in inputRows:
        # for value in row:
        #     if value == 'nan'

        X.append(row)


with open(targetDataFileName, 'rU') as openOutputFile:
    outputRows = csv.reader(openOutputFile)
    for row in outputRows:
        try:
            row[0] = float(row[0])
        except:
            row[0] = row[0]
        y.append(row[0])
# printParent( X )

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=0)

rf = RandomForestClassifier(n_estimators=30, n_jobs=-1)

# TODO TODO: define parameters_to_try
print size(X_train)

parameters_to_try = {
    'criterion': ['gini','entropy'],
    'max_features': ['sqrt','log2',None,math.sqrt()]
}

clf = GridSearchCV(rf, parameters_to_try, cv=10, n_jobs=-1)

rf.fit(X_train, y_train)

