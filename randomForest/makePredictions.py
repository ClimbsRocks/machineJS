import json
import os
import sys
import csv
import time
import cPickle as pickle


def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)

printParent('scurrying off to make predictions now!')

fileName = os.path.split(sys.argv[1])[1]
inputFilePath = sys.argv[1]

# find the path to this file we're currently writing code in, and create a file in that directory that appends 'y' to the filename the user gave us
y_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'y_predict' + fileName)
X_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'X_predict2' + fileName)

X = []
y = []


# load up the prediction data set
with open(X_file_name, 'rU') as x_file:
    inputRows = csv.reader(x_file)
    for row in inputRows:
        # for value in row:
        #     if value == 'nan'

        X.append(row)

with open(y_file_name, 'rU') as y_file:
    outputRows = csv.reader(y_file)
    for row in outputRows:
        try:
            row[0] = float(row[0])
        except:
            row[0] = row[0]
        y.append(row[0])

# load up the previously trained (and tuned!) random forest classifier
with open('randomForest/bestRF.p', 'rU') as clf_file:
    rf = pickle.load(clf_file)

dictVectMapping = sys.argv[2].split(',')

columnLabels = [item.lower() for item in dictVectMapping]
try:
    idIndex = columnLabels.index('id')
except:
    printParent('no idIndex found')
    idIndex = 1
printParent('idIndex')
printParent(idIndex)

time.sleep(2)

with open('predictions/randomForestRaw.csv', 'w+') as predictionsFile:
    csvwriter = csv.writer(predictionsFile)
    # get predictions for each item in the prediction data set
    predictedResults = rf.predict_proba(X)
    printParent('predicted results for every item in the predictions dataset!')
    printParent(predictedResults.shape)
    for prediction in predictedResults:
        try:
            len(prediction)
            csvwriter.writerow(prediction)
        except:
            csvwriter.writerow([prediction])

with open('predictions/randomForestClean.csv', 'w+') as predictionsFile:
    csvwriter = csv.writer(predictionsFile)
    csvwriter.writerow(['ID','Probability'])
    # get predictions for each item in the prediction data set
    predictedResults = rf.predict_proba(X)
    printParent('predicted results for every item in the predictions dataset!')
    printParent(predictedResults.shape)
    for prediction in predictedResults:
        try:
            len(prediction)
            csvwriter.writerow(prediction[0])
        except:
            csvwriter.writerow([prediction])


# write those predictions to a single, standalone, centralized file that ONLY holds the ID for that row, and then the predictions for each model. 
# Nope. Each classifier writes it's own predictions to it's own file. 
    # we will keep an array in ppLib.js that has references to all the file names
    # the files will all be in a predictions folder, that will hold nothing but these files holding the predictions from a single classifier
    # once we have all of them written (this way we don't need to worry about asynchronicity issues, or multiple classifiers trying to write to the same file), we can go through and either centralize all of them into a single file, or just iterate through all of the files. 
    # if we can keep metadata on each file (or, in the array with the file names, hold objects that have information such as observed error rate, relative ranking within all the classifiers of that type, type of classifier, training time, etc.)



