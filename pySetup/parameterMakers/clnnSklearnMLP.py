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

    # we want to test up to 10 layers, with anywhere from .5 * numFeatures to 10*numFeatures per layer
    hiddenLayers = []

    # for each hidden layer, we will have these numbers * numFeatures number of nodes
    nodeMultipliers = [.5,1,2,3,5,10]

    # we will create options for each number of hidden layers listed below
    hiddenLayerMultipliers = [1,2,3,5,10]

    for hlNum in hiddenLayerMultipliers:
        for nodeNum in nodeMultipliers:
            hiddenLayers.append( [ nodeNum * numFeatures for x in range(hlNum) ])            


    # parameters we are not searching currently:
        # tol
        # shuffle
        # batch_size
        # hidden_layer_sizes

    parameters_to_try = {
        'hidden_layer_sizes': hiddenLayers,
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
