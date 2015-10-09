from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

# other splits for SVC kernel:
# linear, poly, rbf, sigmoid, precomputed

def makeClassifiers(globalArgs):
    return {
        'clRfGini': RandomForestClassifier(n_estimators=15, n_jobs=globalArgs['numCPUs'], criterion='gini'),
        'clRfEntropy': RandomForestClassifier(n_estimators=15, n_jobs=globalArgs['numCPUs'], criterion='entropy'),
        'clSVCFirst': SVC(probability=True, shrinking=False),
        'clSVCShrinking': SVC(probability=True, shrinking=True)
    }
