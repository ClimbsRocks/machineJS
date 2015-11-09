import json

def printParent(text):
    messageObj = {
        'text': text,
        'type': 'console.log'
    }
    print json.dumps(messageObj)


def messageParent(messageText, type):
    messageObj = {
        'text': messageText,
        'type': type
    }
    print json.dumps(messageObj)


def obviousPrint(label, obj):
    printParent('#######################################################################################################################')
    printParent('#######################################################################################################################')
    printParent(label)
    printParent(obj)
