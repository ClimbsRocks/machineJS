import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):

    # GridSearchCV parameters:
    # parameters_to_try = {
    #     'n_estimators': [5,50,150],
    #     'learning_rate': [.1, .3],
    #     'algorithm':['SAMME','SAMME.R']
    # }

    # RandomizedSearchCV parameters:
    # ideally, I think this would be a gamma distribution most likely. 
    

    parameters_to_try = {
        "n_estimators": scipy.stats.randint(25,500),
        "learning_rate": scipy.stats.expon(.001, 2),
        "loss": ['linear','square','exponential'],
        "algorithm": ['SAMME','SAMME.R']
    }

    if problemType not in ['category', 'multi-category']:
        try:
            parameters_to_try.pop('algorithm', None)
        except:
            pass
    else:
        parameters_to_try.pop('loss', None)
        

    if dev:
        parameters_to_try.pop('learning_rate', None)
        try:
            parameters_to_try.pop('algorithm', None)
        except:
            pass
        
    return parameters_to_try
