import json
import sys
import random

import numpy as np
from scipy.sparse import csr_matrix

from sendMessages import printParent
from sendMessages import messageParent
from sendMessages import obviousPrint

# TODO: Pass in these variables:
args = json.loads(sys.argv[2])
fileNames = json.loads(sys.argv[3])

# what percent of our dataset should we use when running RandomizedSearchCV (sister to GridSearchCV) on our dataset to determine the optimal parameters?
searchPercent = args['searchPercent']
# what percent of our dataset to not train on, but to set aside for validation and stacking/blending?
validationPercent = args['validationPercent']



X_file_name = fileNames['X_train']

# this will only work on sparse matrices
def load_sparse_csr(filename):
    loader = np.load(filename)
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 

X = load_sparse_csr(X_file_name)

numRows = X.shape[0]

includeOrNot = [random.random() for x in range(0,numRows)]

# create a function that takes in an idx and row, and based on includeOrNot and some logic, decides where to place it
# we are going to have to repeat this process many times:
    # idColumn
    # X_train
    # y_train
    # X_train_nn

searchIndices = []
trainingDataIndices = []
validationIndices = []

for idx, randomNum in enumerate(includeOrNot):
    if randomNum < searchPercent:
        searchIndices.append(idx)
    elif randomNum < 1 - validationPercent:
        trainingDataIndices.append(idx)
    else:
        validationIndices.append(idx)

def splitDataset(data):

    search = data[searchIndices,:]
    allTrainingData = data[trainingDataIndices,:]
    validation = data[validationIndices,:]

    printParent('search.shape')
    printParent(search.shape)
    printParent('allTrainingData.shape')
    printParent(allTrainingData.shape)
    printParent('validation.shape')
    printParent(validation.shape)

splitDataset(X)


