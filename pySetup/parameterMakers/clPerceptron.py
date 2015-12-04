import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):

    # I am not yet confident in eta0
    parameters_to_try = {
        "penalty": [None,'l2','l1','elasticnet'],
        "alpha": scipy.stats.expon(.00001,.001),
        "shuffle": [True,False],
        # "eta0": scipy.stats.expon(.0001,1),
    }        
        
    return parameters_to_try
