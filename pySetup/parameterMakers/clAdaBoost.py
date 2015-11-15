import scipy

def makeParams(X, y, globalArgs, dev, problemType):

    # GridSearchCV parameters:
    parameters_to_try = {
        'n_estimators': [5,50,150],
        'learning_rate': [.1, .3],
        'algorithm':['SAMME','SAMME.R']
    }

    # RandomizedSearchCV parameters:
    # ideally, I think this would be a gamma distribution most likely. 
    # parameters_to_try = {
    #     "n_estimators": scipy.stats.randint(25,150)
    # }

    if problemType != 'category':
        parameters_to_try.pop('algorithm', None)

    if dev:
        parameters_to_try.pop('learning_rate', None)
        try:
            parameters_to_try.pop('algorithm', None)
        except:
            pass
        
    return parameters_to_try
