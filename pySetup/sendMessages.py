import json

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
