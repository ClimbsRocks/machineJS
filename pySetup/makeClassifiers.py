from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC



def makeClassifiers(globalArgs):
    return {
        'clRfGini': RandomForestClassifier(n_estimators=15, n_jobs=globalArgs['numCPUs'], criterion='gini'),
        'clRfEntropy': RandomForestClassifier(n_estimators=15, n_jobs=globalArgs['numCPUs'], criterion='entropy'),
        'clSVCFirst': SVC(probability=True)
    }
