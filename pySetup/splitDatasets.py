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

args = json.loads(sys.argv[2])
fileNames = json.loads(sys.argv[3])
XFileName = fileNames['X_train']
XnnFileName = fileNames['X_train_nn']
ynnFileName = fileNames['y_train_nn']
idFileName = fileNames['id_train']
yTrainFileName = fileNames['y_train']

outputDirectory = path.dirname(XFileName)

# what percent of our dataset to not train on, but to set aside for validation and stacking/blending?
validationPercent = args['validationPercent']


# we are not supporting dense matrices at the moment. 
def load_sparse_csr(filename):
    loader = np.load(filename)
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 

X = load_sparse_csr(XFileName)


numRows = X.shape[0]

includeOrNot = [random.random() for x in range(0,numRows)]

# we want to save the validation indices with the test data. that way we can have multiple different training data sets scattered throughout a computer, but still use these same validationIndices for all of them
validationIndexFolder = path.dirname(args['predict'])
validationIndexFileName = 'dfValidationIndices' + args['testOutputFileName'] + '.pkl'
validationIndicesFile = path.join( validationIndexFolder, validationIndexFileName )


writeToFile = True
createNewSplit = False

# try to load in existing validationIndices
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

        # check to make sure that the validation length is within a few percentage points of our validationPercent number (in other words, if X is 10,000 rows long, and the length of the validationIndices is only 1,200, then we know validationIndices was built on a smaller test dataset earlier.)
        elif len(validationIndices) < numRows * validationPercent * .98:
            printParent('validationIndices too short')
            # If it is not, create a new validationIndices and write that to file
            raise IndexError("this dataset is longer than the one we built the validation split on previously")
            
        # In both cases, fall into the except state below
        # but create a variable that lays out whether to write that new validationIndices to file or not in the try block, and then use that in the except block below

        # if we found existing validationIndices that meet the criteria above, we still want to split our incoming dataset on those indices
        # this allows us to change our feature engineering on a training dataset, and pass those features through to machineJS
        trainingIndices = []
        validationIndicesCopy = validationIndices[:]
        # it should already be sorted, but we're being safe here in case of future changes
        validationIndicesCopy.sort()
        validationIndicesCounter = 0

        # linear comparison of two lists to only put indices into trainingIndices if they are not in validationIndices
        for x in range(0,numRows):
            if x == validationIndicesCopy[validationIndicesCounter]:
                validationIndicesCounter += 1
            else:
                trainingIndices.append(x)
        del validationIndicesCopy


# in the case that we were not able to load in validationIndices successfully, we want to write our validationIndices to file for all future runs to use
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
        with open(validationIndicesFile, 'w') as writeFile:
            # now save that file as a .pkl next to where our test data sits. 
            pickle.dump(validationIndices, writeFile)


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
        validation = data[:,validationIndices]
        trainingData = data[:,trainingIndices]

    else:
        validation = data[validationIndices,:]
        trainingData = data[trainingIndices,:]

    # ntpath theoretically works really well across systems
    name = ntpath.basename(name)
    # remove the file extension
    name = name[0:-4]

    validationFile = path.join(outputDirectory, name + 'validationData.npz')
    trainingDataFile = path.join(outputDirectory, name + 'trainingData.npz')

    save_sparse_csr(trainingDataFile, trainingData)
    save_sparse_csr(validationFile, validation)

    # send the file names back to the parent process, where we aggregate and save them
    fileNameDict = {
        fileCategory + 'trainingData': trainingDataFile,
        fileCategory + 'validationData': validationFile
    }
    messageParent(fileNameDict, 'splitFileNames')


# we are going to repeat this process several times:
    # idColumn
    # X_train
    # y_train
    # X_train_nn
# they are just slightly different enough that i don't want to loop through them. The code below is super readable

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
splitDataset(ynn, ynnFileName, 'y_train_nn')
del ynn

