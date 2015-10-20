import math

def makeParams(X, y, globalArgs, dev):

    # TODO: figure out more interesting parameters to try
        # follow a similar pattern to what we did for brainjs, basing the number of nodes on the size of the input
        # test number of hidden layers
    # TODO: break out each type into it's own classifier
    parameters_to_try = {
        'learning_rate': [0.001, 0.1, 0.6],
        'hidden0__units': [4,8,12],
        'hidden0__type': ["Rectifier","Sigmoid","Tanh"]
    }

    if dev:
        parameters_to_try.pop('learning_rate', None)
        parameters_to_try.pop('hidden0__units', None)
        
    return parameters_to_try
