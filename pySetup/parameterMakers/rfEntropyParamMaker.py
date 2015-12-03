import math
import scipy
import numpy as np

from sendMessages import printParent

def makeParams(X, y, globalArgs, dev, problemType):

    try:
        # if dense
        numColumns = len(X[0])
    except:
        # if sparse
        numColumns = X.shape[1]

    sqrtNum = int(math.sqrt(numColumns))
    # GridSearchCV parameters:

    # max_features_to_try = [sqrtNum + x for x in (-2,0,2)]
    # max_features_to_try.append('log2')
    # max_features_to_try.append(None)

    # parameters_to_try = {
    #     'max_features': max_features_to_try,
    #     'min_samples_leaf':[1,2,5,25,50,100,150]
    # }


    maxFeaturesList = np.random.lognormal(sqrtNum, 2, 10)
    # if using lognormal, check out this link:
        # http://stackoverflow.com/questions/12937824/lognormal-random-numbers-centered-around-a-high-value
    # 'max_features': scipy.stats.lognorm([sqrtNum/5], int(sqrtNum)),

    # RandomizedSearchCV parameters:
    parameters_to_try = {
        'max_features': scipy.stats.randint(1,numColumns),
        'min_samples_leaf': scipy.stats.randint(1,200),
        'min_samples_split': scipy.stats.randint(2,20),
        'bootstrap': [True,False]
    }

    if dev:
        parameters_to_try.pop('min_samples_leaf', None)
        parameters_to_try.pop('max_features', None)
        parameters_to_try['max_features'] = [sqrtNum, 'log2']
                
    return parameters_to_try

'''
determine which parameters we want to mess with
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

'''
