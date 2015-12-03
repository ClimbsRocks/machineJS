import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):

    # Other parameters to try: tol, class_weight, penalty
    # I do not want to spend long optimizing logistic regressions, as we have other classifiers that are generally considered more effective across many different problem types. 
    # TODO: break all of these out into their own classifiers- newton-cg, lbfgs, and liblinear
        # we are spending all the time training them as their own separate instances anyways (that's what gridsearch does), we might as well make use of that output for our creative ensembling
    parameters_to_try = {
        'C': scipy.stats.expon(.001,1),
        'solver': ['newton-cg', 'lbfgs', 'liblinear'],
    }

    if dev:
        parameters_to_try.pop('C', None)
        
    return parameters_to_try
