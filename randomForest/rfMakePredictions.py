import cPickle as pickle 
import json



def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)

printParent('scurrying off to make predictions now!')

# load up the prediction data set
# load up and use the dictVectorizer
# get predictions for each item in the prediction data set
# write those predictions to a file
