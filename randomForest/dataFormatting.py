# read the data in so that each line is a dict
  # ideally python would do this for us directly, knowing the column headers. but if it doesn't, we could do it super easily ourselves (read in the row as a list, read in the column headers as the first row as a list, create an object as we go where we look up the feature_name by the current position within the first row)
  # update: python does it for us:
    # https://docs.python.org/3/library/csv.html#csv.DictReader
# run DictVectorizer on it!
  # http://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.DictVectorizer.html
  # this handles binarizing as well as keeping track of the order while turning it into a list and such. this should do all we need it to. 
# possibly write this to file somewhere, rather than having to run this for each new python child_process we spin up? 
import sys
import csv
import os
import math
import json
import cPickle as pickle
import sklearn
from sklearn.feature_extraction import DictVectorizer
dictVectorizer1 = DictVectorizer()


print 'hi from inside the snake!'

# API: this requires the full absolute path to the input data file
fileName = os.path.split(sys.argv[1])[1]
inputFilePath = sys.argv[1]

# find the path to this file we're currently writing code in, and create a file in that directory that appends 'y_train' to the filename the user gave us
y_train_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'y_train' + fileName)
X_train_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'X_train2' + fileName)
X_train_temp_file_name = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'X_train' + fileName)

def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)


printParent('hi from parent Printer')

with open(inputFilePath, 'rU') as csvInput:
    csvRows = csv.reader(csvInput)
    # create new files for our output column and input columns
    y_train_file = open(y_train_file_name, 'w+')
    y_train_file_csv = csv.writer(y_train_file)
    firstRow = False
    with open(X_train_temp_file_name, 'w+') as X_train_temp_file:
        X_train_temp_file_csv = csv.writer(X_train_temp_file)


        for row in csvRows:
            # write the output column to the output file
            newRow = []
            if firstRow:
                y_train_file_csv.writerow( [row.pop(0)] )

                for value in row:
                    if value == 'NA':
                        value = 0
                    newRow.append(value)
            else:
                firstRow = True
                # we want to push the labels in directly, after taking out the output label
                row.pop(0)
                newRow = row
            # remove all 'NA' from the input, then write it to a file
            X_train_temp_file_csv.writerow( newRow )
    y_train_file.close()
    

with open(X_train_temp_file_name, 'rU') as X_train_temp_file:
    with open(X_train_file_name, 'w+') as X_train_file:
        X_train_file_csv = csv.writer(X_train_file)

        inputRows = csv.DictReader(X_train_temp_file)
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
        printParent('we have correctly built up the input list')
        vectorizedInput = dictVectorizer1.fit_transform(inputList)
        printParent( 'we have vectorized the input' )
        pickle.dump(dictVectorizer1, open('randomForest/dictVectorizer.p', 'w+'))
        printParent('we have pickled the dictVectorizer')
        printParent( vectorizedInput.toarray().shape )
        X_train_file_csv.writerows(vectorizedInput.toarray())
        os.remove(X_train_temp_file_name)
