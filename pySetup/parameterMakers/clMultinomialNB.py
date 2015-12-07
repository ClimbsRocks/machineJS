import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):

    parameters_to_try = {
        'alpha': np.random.uniform(0,1,1000)
    }
        
    return parameters_to_try
