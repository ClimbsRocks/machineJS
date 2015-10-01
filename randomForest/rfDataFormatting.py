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
import sklearn
from sklearn.feature_extraction import DictVectorizer
dictVectorizer1 = DictVectorizer()

# API: this requires the full absolute path to the input data file
fileName = os.path.split(sys.argv[1])[1]
fullPathToDataFile = sys.argv[1]

# find the path to this file we're currently writing code in, and create a file in that directory that appends 'pythonOutputVect' to the filename the user gave us
outputFileName = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'pythonOutputVect' + fileName)
inputFileName2 = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'pythonInputVect2' + fileName)
inputFileName = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'pythonInputVect' + fileName)

def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)


with open(fullPathToDataFile, 'rU') as csvInput:
    csvRows = csv.reader(csvInput)
    # create new files for our output column and input columns
    outputFile = open(outputFileName, 'w+')
    csvProcessedOutputFile = csv.writer(outputFile)
    firstRow = False
    with open(inputFileName, 'w+') as inputFile:
        csvProcessedInputFile = csv.writer(inputFile)


        for row in csvRows:
            # write the output column to the output file
            newRow = []
            if firstRow:
                csvProcessedOutputFile.writerow( [row.pop(0)] )

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
            csvProcessedInputFile.writerow( newRow )
    outputFile.close()
    

# TODO TODO: we are getting a number of 'nan' values- sort this out!
with open(inputFileName, 'rU') as csvInputToVectorize:
    with open(inputFileName2, 'w+') as outputFile2:
        csvProcessedOutputFile2 = csv.writer(outputFile2)

        inputRows = csv.DictReader(csvInputToVectorize)
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
        printParent( 'we have correctly built up the input list' )
        vectorizedInput = dictVectorizer1.fit_transform(inputList)
        printParent( 'we have vectorized the input' )
        printParent( vectorizedInput.toarray().shape )
        csvProcessedOutputFile2.writerows(vectorizedInput.toarray())
