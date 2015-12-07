# this file simply holds a list of all the classifiers we have enabled RandomizedSearchCV for. 
# if you would like to have more control over the process, and use GridSearchCV, please modify this file to say False for the algorithm you want to run GridSearchCV on.

def rsList():
    return {
        'clnnSknn': False,
        'clnnNoLearn': False,
        'clKnn': False,
        'clSVCFirst': False,
        'clSVCShrinking': False,
        'clnnSknn3Layer': False,
        'clRfEntropy': True,
        'clLogisticRegression': True,
        'clXGBoost': True,
        'clRfGini': True,
        'clRfBootstrapTrue': True,
        'clAdaBoost': True,
        'clAdaLossLinear': True,
        'clAdaLossSquare': True,
        'clAdaLossExponential': True,
        'clMultinomialNB': True,
        'clPerceptron': True,
        'clSGDClassifier': True,
        'clExtraTrees': True,
        'clnnSklearnMLP': True
    }
