# ok, unfortunately, this is how it probably has to work:
# 1. we manually (hard code the names in here) import all the individual parameterMaker files here
# 2. we have a master calculateParams function

# 3. into that function we will pass X and y
# 4. that function will then go off and invoke all the individual parameterMaker functions, saving their results into a dictionary with keys that mirror 'clRandomForest'
# 5. that function will then return the dictionary
# 6. then back in training.py we can look up the classifierName within that dictionary to get the parameters

import rfParamMaker

def makeAll(X,y,globalArgs):
    return {
        'clRandomForest':rfParamMaker.makeParams(X,y,globalArgs)
    }
