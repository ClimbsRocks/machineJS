import json
import os
import os.path as path
import sys
import csv
import time
import joblib
import numpy as np
import logging
import xgboost

from scipy.sparse import csr_matrix

from sendMessages import printParent
from sendMessages import messageParent
from sendMessages import obviousPrint

logging.basicConfig()

fileNames = json.loads(sys.argv[4])
classifierName = sys.argv[5]
argv = json.loads(sys.argv[3])
problemType = sys.argv[6]

if( classifierName[0:4] == 'clnn' ):
    nn = True
    X_file_name = fileNames['X_test_nn']
else:
    nn = False
    X_file_name = fileNames['X_test']

id_file_name = fileNames['id_test']
y_file_name = fileNames['y_train']


X = []
idColumn = []

# load up the prediction data set, without the header row
try:
    def load_sparse_csr(filename):
        loader = np.load(filename)
        return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 
    
    X = load_sparse_csr(X_file_name)
except:
    with open(X_file_name, 'rU') as x_file:
        inputRows = csv.reader(x_file)
        headerRow = False
        for row in inputRows:
            if(headerRow):
                X.append(row)
            else:
                headerRow = True

# try:
# should be pretty safe to convert the idColumn to a list, since it is always going to be a single value per row
# to get a single vector (in this case, our ID column) to be saved as a sparse matrix, we have to do some vaguely hacky stuff
# the following line converts it to a normal python list
idColumn = load_sparse_csr( id_file_name ).todense().tolist()[0]
# except:
#     with open(id_file_name, 'rU') as id_file:
#         inputRows = csv.reader(id_file)
#         idHeader = False
#         for row in inputRows:
#             if idHeader == False:
#                 idHeader = row[0]
#             else:
#                 # the csv reader will read each row in as a list, even if that list only has a single item in it
#                 # append each row ID value to idColumn
#                 idColumn.append(row[0])


try:
    idHeader = fileNames['idHeader']
    outputHeader = fileNames['outputHeader']
except:
    # read in the y_file simply to get the pretty header name for the output column
    with open(y_file_name, 'rU') as y_file:
        inputRows = csv.reader(y_file)
        outputHeader = False
        for row in inputRows:
            if outputHeader == False:
                outputHeader = row[0]
            else:
                pass


# load up the previously trained (and tuned!) classifier
classifier = joblib.load('pySetup/bestClassifiers/best' + classifierName + '/best' + classifierName + '.pkl')

# if nn or classifierName == 'clXGBoost':
#     X = np.array(X)
# if nn:
#     X = np.array(X)

try:
    classifier.set_params(n_jobs=-1)
except:
    pass

# get predictions for each item in the prediction data set
if problemType == 'category':
    predictedResults = classifier.predict_proba(X)
else:
    predictedResults = classifier.predict(X)

del X

validationFile = fileNames['X_trainvalidationData']
validationData = load_sparse_csr(validationFile)
validationIdFile = fileNames['id_trainvalidationData']
validationIDs = load_sparse_csr( validationIdFile ).todense().tolist()[0]

if problemType == 'category':
    validationPredictions = classifier.predict_proba(validationData)
else:
    validationPredictions = classifier.predict(validationData)

try:
    validationScore = classifier.score(X,y)
except:
    validationScore = 0


if not os.path.exists('predictions'):
    os.makedirs('predictions')


# write our predictions on the test data to a file
predictionsPath = path.join( 'predictions', argv['testFilePretty'])
if not os.path.exists(predictionsPath):
    os.makedirs(predictionsPath)
predictionsFileName = argv['outputFileName'] + classifierName + str(time.time()) + '.csv'

with open( path.join(predictionsPath, predictionsFileName) , 'w+') as predictionsFile:
    csvwriter = csv.writer(predictionsFile)

    # we are going to have to modify this when we allow it to make categorical predictions too. 
    csvwriter.writerow([idHeader,outputHeader])
    for idx, prediction in enumerate(predictedResults):
        rowID = idColumn[idx]

        try:
            len(prediction)
            csvwriter.writerow([rowID,prediction[1]])
        except:
            csvwriter.writerow([rowID,prediction])


# write our validation predictions to a file too
validationPath = path.join( 'predictions', argv['testFilePretty'], 'validation')
if not os.path.exists(validationPath):
    os.makedirs(validationPath)
validationFileName = argv['outputFileName'] + classifierName + str(time.time()) +'.csv'

with open( path.join(validationPath, validationFileName) , 'w+') as validationFile:
    csvwriter = csv.writer(validationFile)

    # at the top of each validation file, write the score for that classifier on the validation set
    csvwriter.writerow([validationScore])
    # we are going to have to modify this when we allow it to make categorical predictions too. 
    csvwriter.writerow([idHeader,outputHeader])
    for idx, prediction in enumerate(validationPredictions):
        rowID = validationIDs[idx]
        # I'm not sure why we're checking if prediction is already a list
            # or why we're taking the second item in that list
        try:
            len(prediction)
            csvwriter.writerow([rowID,prediction[1]])
        except:
            csvwriter.writerow([rowID,prediction])



# if the final output is binary, create a separate file at this stage that can be easily uploaded to kaggle by rounding the predicted value to the nearest int
# We will use the actual probability in ensembler, but it's nice at this stage to be able to upload results to kaggle and get some feedback
if argv[ 'binaryOutput'] == 'true':

    # first check to make sure that we have a distinct file name. if not, append the name of the enclosing folder to the fileName
                    
    # add kaggle to the front of the name to make it obvious that this is for kaggle
    # this also keeps the rest of our files consistent for ensembler
    kagglePath = path.join( 'predictions', argv['testFilePretty'], 'kaggle')
    if not os.path.exists(kagglePath):
        os.makedirs(kagglePath)
    kaggleFileName = argv['outputFileName'] + classifierName + str(time.time()) + '.csv'
    with open( path.join(kagglePath, kaggleFileName) , 'w+') as predictionsFile:
        csvwriter = csv.writer(predictionsFile)

        csvwriter.writerow([idHeader,outputHeader])
        for idx, prediction in enumerate(predictedResults):

            rowID = idColumn[idx]
            # I'm not sure why we're checking if prediction is already a list
                # or why we're taking the second item in that list
            try:
                len(prediction)
                prediction = int( round( prediction[1] ) )
            except:
                prediction = int( round( prediction ) )
                pass
            csvwriter.writerow( [rowID,prediction] )

# if we can, keep metadata on each file (or, in the array with the file names, hold objects that have information such as observed error rate, relative ranking within all the classifiers of that type, type of classifier, training time, etc.)
