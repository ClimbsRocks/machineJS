# this file simply holds a list of all the classifiers we have enabled RandomizedSearchCV for. 
# if you would like to have more control over the process, and use GridSearchCV, please modify this file to say False for the algorithm you want to run GridSearchCV on.

def rsList():
    return {
        'clnnSknn': False,
        'clnnNoLearn': False,
        'clKnn': False,
        'clRfEntropy': False,
        'clSVCFirst': False,
        'clSVCShrinking': False,
        'clnnSknn3Layer': False,
        'clLogisticRegression': False,
        'clXGBoost': True,
        'clRfGini': True,
        'clRfBootstrapTrue': True,
        'clAdaBoost': True
    }
