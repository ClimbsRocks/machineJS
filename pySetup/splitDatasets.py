import json
import sys
import random
from os import path
import ntpath
import cPickle as pickle

import numpy as np
from scipy.sparse import csr_matrix, csc_matrix

from sendMessages import printParent
from sendMessages import messageParent
from sendMessages import obviousPrint

# TODO: Pass in these variables:
args = json.loads(sys.argv[2])
fileNames = json.loads(sys.argv[3])
XFileName = fileNames['X_train']
XnnFileName = fileNames['X_train_nn']
ynnFileName = fileNames['y_train_nn']
idFileName = fileNames['id_train']
yTrainFileName = fileNames['y_train']

outputDirectory = path.dirname(XFileName)

# what percent of our dataset should we use when running RandomizedSearchCV (sister to GridSearchCV) on our dataset to determine the optimal parameters?
searchPercent = args['searchPercent']
# what percent of our dataset to not train on, but to set aside for validation and stacking/blending?
validationPercent = args['validationPercent']



# we are not supporting dense matrices at the moment. 
def load_sparse_csr(filename):
    loader = np.load(filename)
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 

X = load_sparse_csr(XFileName)

numRows = X.shape[0]

printParent('numRows: ' + str(numRows))

includeOrNot = [random.random() for x in range(0,numRows)]

validationIndexFolder = path.dirname(args['kagglePredict'])
validationIndexFileName = 'dfValidationIndices' + args['testOutputFileName'] + '.pkl'
validationIndicesFile = path.join( validationIndexFolder, validationIndexFileName )
writeToFile = True
try:
    with open(validationIndicesFile, 'rb') as openFile:
        validationIndices = pickle.load(openFile)
        maxVal = max( validationIndices )
        # check to make sure that the validation length is less than the length of our X dataset
        if len(validationIndices) > numRows * ( validationPercent - .02):
            # if it isn't, create a new validationIndices for this dataset, but do not write it to file
            # this lets us keep our larger validationIndices split (for the full training data set), while still having something to work with for this smaller dataset we're currently testing on.
            writeToFile = False
            raise IndexError("this dataset is shorter than the one we built the validation split on previously")

        # check to make sure that the validation length is within a few percentage points of our validationPercent number (in other words, if X is 10,000 rows long, and the largest number in validationIndices is only 1,200, then we know validationIndices was built on a smaller test dataset earlier.)
        elif len(validationIndices) < numRows * validationPercent * .98:
            # If it is not, create a new validationIndices and write that to file
            raise IndexError("this dataset is longer than the one we built the validation split on previously")
            
        # In both cases, fall into the except state below
        # but create a variable that lays out whether to write that new validationIndices to file or not in the try block, and then use that in the except block below

except:
    validationIndices = []
    trainingIndices = []
    for idx, randomNum in enumerate(includeOrNot):
        if randomNum < validationPercent:
            validationIndices.append(idx)
        else:
            trainingIndices.append(idx)

    if writeToFile:
        with open(validationIndicesFile, 'w+') as writeFile:
            # now save that file as a .pkl next to where our test data sits. 
            pickle.dump(validationIndices, writeFile)

# searchIndices = []
# trainingDataIndices = []

# for idx, randomNum in enumerate(includeOrNot):
#     if randomNum < searchPercent:
#         searchIndices.append(idx)
#     elif randomNum < 1 - validationPercent:
#         trainingDataIndices.append(idx)
#     else:
#         validationIndices.append(idx)

# continued callout to the person originally responsible for this function:
# http://stackoverflow.com/questions/8955448/save-load-scipy-sparse-csr-matrix-in-portable-data-format
def save_sparse_csr(filename,array):
    np.savez(filename,data=array.data ,indices=array.indices, indptr=array.indptr, shape=array.shape )

def splitDataset(data, name, fileCategory):

    # uses slicing, one of the most useful and least-well-known features of scipy sparse matrices
    # you pass in a list of row indices you want to keep, and it will create a sliced copy that includes only those rows
    # slicing also works on column indices
    # callout to the person who first opened my eyes to them:
    # http://stackoverflow.com/questions/13352280/slicing-sparse-matrices-in-scipy-which-types-work-best

    # if this "sparse" matrix only has a single value for each row, we have to treat it as a column matrix, and slice it accordingly
    # this is the case for our idColumn, and frequently our y values as well.
    if data.shape[0] == 1:
        # search = data[:,searchIndices]
        # longTrainingData = data[:,trainingDataIndices]
        validation = data[:,validationIndices]
        trainingData = data[:,trainingIndices]

    else:
        # search = data[searchIndices,:]
        # longTrainingData = data[trainingDataIndices,:]
        validation = data[validationIndices,:]
        trainingData = data[trainingIndices,:]

    name = ntpath.basename(name)
    name = name[0:-4]

    # searchFile = path.join(outputDirectory, name + 'searchData.npz')
    # longTrainingFile = path.join(outputDirectory, name + 'longTrainingData.npz')
    validationFile = path.join(outputDirectory, name + 'validationData.npz')
    trainingDataFile = path.join(outputDirectory, name + 'trainingData.npz')

    # save_sparse_csr(searchFile, search)
    # save_sparse_csr(longTrainingFile, longTrainingData)
    save_sparse_csr(validationFile, validation)
    save_sparse_csr(trainingDataFile, trainingData)

    fileNameDict = {
        fileCategory + 'trainingData': trainingDataFile,
        fileCategory + 'validationData': validationFile
    }
    messageParent(fileNameDict, 'splitFileNames')

# we are going to have to repeat this process many times:
    # idColumn
    # X_train
    # y_train
    # X_train_nn

splitDataset(X, XFileName, 'X_train')
del X

idColumn = load_sparse_csr(idFileName)
splitDataset(idColumn, idFileName, 'id_train')
del idColumn

yColumn = load_sparse_csr(yTrainFileName)
splitDataset(yColumn, yTrainFileName, 'y_train')
del yColumn

Xnn = load_sparse_csr(XnnFileName)
splitDataset(Xnn, XnnFileName, 'X_train_nn')
del Xnn

ynn = load_sparse_csr(ynnFileName)
# obviousPrint('y neural net inside splitDatasets.py',ynn.toarray().tolist()[0][0:100])
splitDataset(ynn, ynnFileName, 'y_train_nn')
del ynn

