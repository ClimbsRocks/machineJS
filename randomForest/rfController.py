# MVP2: listen for communication coming in from parent process in node
# take in data that's already half formatted from JS process
  # TODO: node process should:
    # binarize the data
    # separate input from output (potentially parse into different files?!)
    # figure out if the data is categorical or numerical
    
from sys import argv
from sklearn.ensemble import RandomForestClassifier
import csv

trainingData = []
targetData = []

targetDataFileName='/Users/preston/ghLocal/machineLearningWork/ppComplete/randomForest/pythonOutputVectkaggleGiveCredit.csv'
inputDataFileName='/Users/preston/ghLocal/machineLearningWork/ppComplete/randomForest/pythonInputVect2kaggleGiveCredit.csv'

with open(inputDataFileName, 'rU') as openInputFile:
    inputRows = csv.reader(openInputFile)
    for row in inputRows:
        # for value in row:
        #     if value == 'nan'

        trainingData.append(row)


with open(targetDataFileName, 'rU') as openOutputFile:
    outputRows = csv.reader(openOutputFile)
    for row in outputRows:
        try:
            row[0] = float(row[0])
        except:
            row[0] = row[0]
        targetData.append(row[0])
print trainingData


rf = RandomForestClassifier(n_estimators=150)

rf.fit(trainingData, targetData)

