import math

def makeParams(X, y, globalArgs, dev):

    try:
        # if dense
        numColumns = len(X[0])
    except:
        # if sparse
        numColumns = X.shape[1]
    sqrtNum = int(math.sqrt(numColumns))


    max_features_to_try = [sqrtNum + x for x in (-2,0,2)]
    max_features_to_try.append('log2')
    max_features_to_try.append(None)


    parameters_to_try = {
        'max_features': max_features_to_try,
        'min_samples_leaf':[1,2,5,25,50,100,150]
    }

    if dev:
        parameters_to_try.pop('min_samples_leaf', None)
    #     parameters_to_try.pop('max_features', None)
        
    return parameters_to_try
