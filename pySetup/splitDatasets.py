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

printParent('inside splitDatasets.py')

# TODO TODO: make sure we are only creating training files if we have not already created the validation indices
    # TODO TODO: this means we probably just grab all the file names, message them to the parent, and then return so we're not doing anything else.

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
# searchPercent = args['searchPercent']
# what percent of our dataset to not train on, but to set aside for validation and stacking/blending?
validationPercent = args['validationPercent']



# we are not supporting dense matrices at the moment. 
def load_sparse_csr(filename):
    loader = np.load(filename)
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 

X = load_sparse_csr(XFileName)

printParent('X.shape inside splitDatasets.py')
printParent(X.shape)

numRows = X.shape[0]

includeOrNot = [random.random() for x in range(0,numRows)]

validationIndexFolder = path.dirname(args['kagglePredict'])
validationIndexFileName = 'dfValidationIndices' + args['testOutputFileName'] + '.pkl'
validationIndicesFile = path.join( validationIndexFolder, validationIndexFileName )
writeToFile = True
createNewSplit = False
try:
    with open(validationIndicesFile, 'rb') as openFile:
        validationIndices = pickle.load(openFile)

        # check to make sure that the validation length is less than the length of our X dataset
        if len(validationIndices) > numRows * ( validationPercent + .02):
            printParent('validationIndices too long')
            # if it isn't, create a new validationIndices for this dataset, but do not write it to file
            # this lets us keep our larger validationIndices split (for the full training data set), while still having something to work with for this smaller dataset we're currently testing on.
            writeToFile = False
            raise IndexError("this dataset is shorter than the one we built the validation split on previously")

        # check to make sure that the validation length is within a few percentage points of our validationPercent number (in other words, if X is 10,000 rows long, and the largest number in validationIndices is only 1,200, then we know validationIndices was built on a smaller test dataset earlier.)
        elif len(validationIndices) < numRows * validationPercent * .98:
            printParent('validationIndices too short')
            # If it is not, create a new validationIndices and write that to file
            raise IndexError("this dataset is longer than the one we built the validation split on previously")
            
        # In both cases, fall into the except state below
        # but create a variable that lays out whether to write that new validationIndices to file or not in the try block, and then use that in the except block below

        trainingIndices = []
        validationIndicesCopy = validationIndices[:]
        # it should already be sorted, but we're being safe here in case of future changes
        validationIndicesCopy.sort()
        # printParent('len(validationIndices) right before converting them to a dense list in splitDatasets.py')
        # printParent(len(validationIndices))
        validationIndicesCounter = 0

        for x in range(0,numRows):
            if x == validationIndicesCopy[validationIndicesCounter]:
                validationIndicesCounter += 1
            else:
                trainingIndices.append(x)
        printParent('len(trainingIndices) right after creating them in splitDatasets.py')
        printParent(len(trainingIndices))


# in this case, we want to write our validationIndices to file for all future runs to use
except:
    createNewSplit = True
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


# # create a 
# searchIndices = []
# trainingDataIndices = []

# for idx, randomNum in enumerate(includeOrNot):
#     if randomNum < searchPercent:
#         searchIndices.append(idx)
#     elif randomNum < 1 - validationPercent:
#         trainingDataIndices.append(idx)

# continued callout to the person originally responsible for this function:
# http://stackoverflow.com/questions/8955448/save-load-scipy-sparse-csr-matrix-in-portable-data-format
def save_sparse_csr(filename,array):
    np.savez(filename,data=array.data ,indices=array.indices, indptr=array.indptr, shape=array.shape )


# we want to write the splits of the training data every time
# but only create a new validationIndices in certain circumstances
def splitDataset(data, name, fileCategory):

    # uses slicing, one of the most useful and least-well-known features of scipy sparse matrices
    # you pass in a list of row indices you want to keep, and it will create a sliced copy that includes only those rows
    # slicing also works on column indices
    # callout to the person who first opened my eyes to them:
    # http://stackoverflow.com/questions/13352280/slicing-sparse-matrices-in-scipy-which-types-work-best

    # if this "sparse" matrix only has a single value for each row, we have to treat it as a column matrix, and slice it accordingly
    # this is the case for our idColumn, and frequently our y values as well.
    if data.shape[0] == 1:
        if not args['validationRound']:
            # search = data[:,searchIndices]
            longTrainingData = data[:,trainingIndices]
        validation = data[:,validationIndices]
        trainingData = data[:,trainingIndices]

    else:
        if not args['validationRound']:
            # search = data[searchIndices,:]
            longTrainingData = data[trainingIndices,:]
        validation = data[validationIndices,:]
        trainingData = data[trainingIndices,:]

    name = ntpath.basename(name)
    name = name[0:-4]

    if not args['validationRound']:
        # searchFile = path.join(outputDirectory, name + 'searchData.npz')
        longTrainingFile = path.join(outputDirectory, name + 'longTrainingData.npz')

    validationFile = path.join(outputDirectory, name + 'validationData.npz')
    trainingDataFile = path.join(outputDirectory, name + 'trainingData.npz')

    if not args['validationRound']:
        # save_sparse_csr(searchFile, search)
        save_sparse_csr(longTrainingFile, longTrainingData)
        save_sparse_csr(trainingDataFile, trainingData)

    save_sparse_csr(validationFile, validation)

    fileNameDict = {
        fileCategory + 'trainingData': trainingDataFile,
        fileCategory + 'validationData': validationFile
    }
    printParent('fileNameDict')
    printParent(fileNameDict)
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

