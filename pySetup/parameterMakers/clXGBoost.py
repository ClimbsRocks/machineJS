def makeParams(X, y, globalArgs, dev):

    parameters_to_try = {
        'num_boost_round': [100, 250, 500],
        'eta': [0.05, 0.1, 0.3],
        'max_depth': [6, 9, 12],
        'subsample': [0.9, 1.0],
        'colsample_bytree': [0.9, 1.0]
    }

    if dev:
        parameters_to_try.pop('num_boost_round', None)
        parameters_to_try.pop('eta', None)
        
    return parameters_to_try
