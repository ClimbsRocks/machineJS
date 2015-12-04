import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):

    # I am not yet confident in eta0
    parameters_to_try = {
        "loss": ['hinge','log','modified_huber','squared_hinge','squared_loss','huber','epsilon_insensitive','squared_epsilon_insensitive'],
        "penalty": ['none','l2','l1','elasticnet'],
        "alpha": scipy.stats.expon(.00001,.001),
        "shuffle": [True,False],
        "epsilon": scipy.stats.expon(.001,1)
        # "eta0": scipy.stats.expon(.0001,1),
    }        
        
    return parameters_to_try
