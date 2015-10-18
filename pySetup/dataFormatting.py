import sys
import csv
import os
import math
import json
import joblib
import sklearn
from sklearn.feature_extraction import DictVectorizer
from sendMessages import printParent
from sendMessages import messageParent

dictVectorizer1 = DictVectorizer()
ppCompleteLocation = json.loads(sys.argv[3])['ppCompleteLocation']
# this requires the full absolute path to the input data file
fileName = os.path.split(sys.argv[1])[1]
inputFilePath = sys.argv[1]
# we are using this same script to format both the training and the predicting data sets. the following variable writes each to separate files
trainOrPredict = sys.argv[2]

if trainOrPredict == 'predict':
    try:
        dictVectorizer1 = joblib.load('pySetup/dataFiles/dictVectorizer.pkl')
    except:
        printParent('trainOrPredict is predict but dictVectorizer.p does not exist')

# find the path to this file we're currently writing code in, and create a file in that directory that appends 'y' to the filename the user gave us
y_file_name = os.path.join(ppCompleteLocation, 'pySetup', 'dataFiles', 'y_' + trainOrPredict + fileName)
X_file_name = os.path.join(ppCompleteLocation, 'pySetup', 'dataFiles', 'X_' + trainOrPredict + fileName)
X_temp_file_name = os.path.join(ppCompleteLocation, 'pySetup', 'dataFiles', 'X_' + trainOrPredict + '_temp' + fileName)

fileNames = {}
fileNames['X_' + trainOrPredict] = X_file_name
fileNames['y_' + trainOrPredict] = y_file_name
messageParent(fileNames, 'fileNames')


with open(inputFilePath, 'rU') as csvInput:
    csvRows = csv.reader(csvInput)
    # create new files for our output column and input columns
    y_file = open(y_file_name, 'w+')
    y_file_csv = csv.writer(y_file)
    firstRow = False
    with open(X_temp_file_name, 'w+') as X_temp_file:
        X_temp_file_csv = csv.writer(X_temp_file)


        for row in csvRows:
            # write the output column to the output file
            newRow = []
            if firstRow:
                # printParent(row)
                y_file_csv.writerow( [row.pop(0)] )

                # remove all 'NA' from the input
                for value in row:
                    if value == 'NA':
                        value = 0
                    newRow.append(value)
            else:
                firstRow = True
                # we want to push the labels in directly, after taking out the output label
                row.pop(0)
                newRow = row
            # write the new row to a file
            X_temp_file_csv.writerow( newRow )
    y_file.close()
    

with open(X_temp_file_name, 'rU') as X_temp_file:
    with open(X_file_name, 'w+') as X_file:
        X_file_csv = csv.writer(X_file)

        inputRows = csv.DictReader(X_temp_file)
        inputList = []
        for row in inputRows:
            newDict = {}
            for key in row:
                try:
                    float(row[key])
                    newDict[key] = float(row[key])
                except:
                    newDict[key] = row[key]
            inputList.append(newDict)
        vectorizedInput = dictVectorizer1.fit_transform(inputList)
        if trainOrPredict == 'train':
            joblib.dump(dictVectorizer1, 'pySetup/dataFiles/dictVectorizer.pkl')
        messageParent(dictVectorizer1.get_feature_names(), 'dictVectMapping')
        X_file_csv.writerows(vectorizedInput.toarray())
        # os.remove(X_temp_file_name)
