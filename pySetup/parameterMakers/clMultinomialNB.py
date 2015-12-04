import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):

    parameters_to_try = {
        'alpha': scipy.stats.uniform(0,1)
    }
        
    return parameters_to_try
