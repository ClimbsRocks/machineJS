def makeParams(X, y, globalArgs, dev, problemType):

    parameters_to_try = {
        'n_estimators': [5,50,150],
        'learning_rate': [.1, .3, .1],
        'algorithm':['SAMME','SAMME.R']
    }

    if problemType != 'category':
        parameters_to_try.pop('algorithm', None)

    if dev:
        parameters_to_try.pop('learning_rate', None)
        try:
            parameters_to_try.pop('algorithm', None)
        except:
            pass
        
    return parameters_to_try
