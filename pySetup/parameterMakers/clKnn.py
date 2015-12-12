def makeParams(X, y, globalArgs, dev, problemType):

    # TODO: knn breaks with sparse matrices. it consumes huge amounts of memory. 
    # https://github.com/ClimbsRocks/machineJS/issues/74

    # leaf size only applies to ball or kd tree, so i'm not sure if we can include it in grid search or not
    # TODO: break all of these out into their own classifiers- 6 possible combinations of algorithm*weights
    parameters_to_try = {
        # 'algorithm': ['ball_tree','kd_tree','brute'],
        # 'weights': ['uniform','distance'],
        # 'leaf_size': [15,30,60,120],
        'n_neighbors': [2,5,10,25,100]
    }

    if dev:
        parameters_to_try.pop('n_neighbors', None)
        # parameters_to_try.pop('max_features', None)
        
    return parameters_to_try
