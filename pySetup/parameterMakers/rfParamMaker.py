import math

def makeParams(X, y, globalArgs, dev):
    sqrtNum = int(math.sqrt(len(X[0])))

    max_features_to_try = [sqrtNum + x for x in (-2,0,2)]
    max_features_to_try.append('log2')
    max_features_to_try.append(None)


    parameters_to_try = {
        'max_features': max_features_to_try,
        'min_samples_leaf':[1,2,5,25,50,100,150],
        'criterion': ['gini','entropy']
        # 'extendedTraining': [True]
    }

    if dev:
        parameters_to_try.pop('min_samples_leaf', None)
        parameters_to_try.pop('max_features', None)
        # parameters_to_try['extendedTraining'] = [False]
        
    return parameters_to_try
