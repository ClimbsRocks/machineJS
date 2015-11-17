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
    }

    if dev:
        parameters_to_try.pop('min_samples_leaf', None)
        parameters_to_try.pop('max_features', None)
        parameters_to_try['max_features'] = [sqrtNum, 'log2']
                
    return parameters_to_try
