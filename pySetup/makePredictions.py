import json
import os
import sys
import csv
import time
import joblib
from sendMessages import printParent
from sendMessages import messageParent

printParent('scurrying off to make predictions now!')

fileNames = json.loads(sys.argv[4])

y_file_name = fileNames['y_predict']
X_file_name = fileNames['X_predict']


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
rf = joblib.load('pySetup/bestRF/bestRF.pkl')

dictVectMapping = sys.argv[2].split(',')

columnLabels = [item.lower() for item in dictVectMapping]
try:
    idIndex = columnLabels.index('id')
except:
    printParent('no idIndex found')
    idIndex = 1

with open('predictions/randomForest.csv', 'w+') as predictionsFile:
    csvwriter = csv.writer(predictionsFile)
    csvwriter.writerow(['ID','Probability'])
    # get predictions for each item in the prediction data set
    predictedResults = rf.predict_proba(X)
    for idx, prediction in enumerate(predictedResults):
        inputRow = X[idx]
        # convert the id from a string to an int
        rowID = int(float(inputRow[idIndex]))
        try:
            len(prediction)
            # printParent('we are in the try block')
            csvwriter.writerow([rowID,prediction[1]])
        except:
            csvwriter.writerow([rowID,prediction])
            # printParent('we are in the exception block')


# write those predictions to a single, standalone, centralized file that ONLY holds the ID for that row, and then the predictions for each model. 
# Nope. Each classifier writes it's own predictions to it's own file. 
    # we will keep an array in ppLib.js that has references to all the file names
    # the files will all be in a predictions folder, that will hold nothing but these files holding the predictions from a single classifier
    # once we have all of them written (this way we don't need to worry about asynchronicity issues, or multiple classifiers trying to write to the same file), we can go through and either centralize all of them into a single file, or just iterate through all of the files. 
    # if we can keep metadata on each file (or, in the array with the file names, hold objects that have information such as observed error rate, relative ranking within all the classifiers of that type, type of classifier, training time, etc.)



