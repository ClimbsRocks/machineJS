import sys
import csv
import os
import math
import json
import cPickle as pickle
import sklearn
from sklearn.feature_extraction import DictVectorizer

dictVectorizer1 = DictVectorizer()

# API: this requires the full absolute path to the input data file
fileName = os.path.split(sys.argv[1])[1]
inputFilePath = sys.argv[1]
# we are using this same file for both the training and the predicting data sets. this variable writes each to separate files
trainOrPredict = sys.argv[2]

if trainOrPredict == 'predict':
    with open('randomForest/dictVectorizer.p', 'rU') as pickle_file:
        dictVectorizer1 = pickle.load(pickle_file)

# find the path to this file we're currently writing code in, and create a file in that directory that appends 'y' to the filename the user gave us
y_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'y_' + trainOrPredict + fileName)
X_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'X_' + trainOrPredict + '2' + fileName)
X_temp_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'X_' + trainOrPredict + fileName)

def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)

def messageParent(text, type):
    messageObj = {
        'text': text,
        'type': type
    }
    print json.dumps(messageObj)



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
            pickle.dump(dictVectorizer1, open('randomForest/dictVectorizer.p', 'w+'))
            printParent('we have pickled the dictVectorizer')
        else:
            printParent('feature names:')
            messageParent(dictVectorizer1.get_feature_names(), 'dictVectMapping')
        printParent( 'we have vectorized the data. it has shape:' )
        printParent( vectorizedInput.toarray().shape )
        X_file_csv.writerows(vectorizedInput.toarray())
        os.remove(X_temp_file_name)
