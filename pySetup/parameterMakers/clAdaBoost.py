def makeParams(X, y, globalArgs, dev):

    parameters_to_try = {
        'n_estimators': [5,50,150],
        'learning_rate': [.1,.3.1],
        'algorithm':['SAMME','SAMME.R']
    }

    if dev:
        parameters_to_try.pop('learning_rate', None)
        parameters_to_try.pop('algorithm', None)
        
    return parameters_to_try
