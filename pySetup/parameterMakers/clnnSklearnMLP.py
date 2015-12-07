import math
import numpy as np
import scipy

def makeParams(X, y, globalArgs, dev, problemType):

    # guidance on params:
        # http://www.slideshare.net/odsc/owen-zhangopen-sourcetoolsanddscompetitions1

    try:
        # if dense
        numFeatures = len(X[0])
        XLength = len(X)
    except:
        # if sparse
        numFeatures = X.shape[1]
        XLength = X.shape[0]

    if XLength < 10000:
        # according to the docs, l-bfgs performs best for small datasets (thousands of items)
        algorithmType = 'l-bfgs'
    else:
        # adam is optimized stochastic gradient descent which performs well for large datasets
        algorithmType = 'adam'

    # parameters we are not searching currently:
        # tol
        # shuffle
        # batch_size
        # hidden_layer_sizes

    parameters_to_try = {
        'activation': ['logistic','tanh','relu'],
        'algorithm': [algorithmType],
        'alpha': scipy.stats.expon(.00001,.001),
        'learning_rate': ['constant','invscaling','adaptive'],
        'learning_rate_init': scipy.stats.expon(.01,.0001),
        'early_stopping': [True],
        'validation_fraction': np.random.uniform(0.8,1,1000),
        'epsilon': scipy.stats.expon( math.pow(10,-7), math.pow(10,-9))
    }
        
    return parameters_to_try
