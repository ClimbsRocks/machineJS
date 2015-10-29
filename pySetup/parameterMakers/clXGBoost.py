def makeParams(X, y, globalArgs, dev):

    # other parameters to investigate that might only exist in the sklearn implementation:
        # learning_rate
        # n_estimators (i have a feeling this is num_boost_round)
        # subsample
        # max_features

    parameters_to_try = {
        # 'num_round': [100, 250, 500],
        # 'eta': [0.05, 0.1, 0.3],
        'max_depth': [6, 9, 12],
        'subsample': [0.9, 1.0],
        'colsample_bytree': [0.9, 1.0]
    }

    # if dev:
        # parameters_to_try.pop('num_round', None)
        # parameters_to_try.pop('eta', None)
        
    return parameters_to_try
