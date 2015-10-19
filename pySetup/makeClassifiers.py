from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sknn.mlp import Classifier, Layer

# other splits for SVC kernel:
# linear, poly, rbf, sigmoid, precomputed

def makeClassifiers(globalArgs):
    return {
        'clRfGini': RandomForestClassifier(n_estimators=15, n_jobs=globalArgs['numCPUs'], criterion='gini'),
        'clRfEntropy': RandomForestClassifier(n_estimators=15, n_jobs=globalArgs['numCPUs'], criterion='entropy'),
        'clSVCFirst': SVC(probability=True, shrinking=False),
        'clSVCShrinking': SVC(probability=True, shrinking=True),
        'clnnSknn': Classifier(
            layers=[
                Layer("Maxout", units=100, pieces=2),
                Layer("Softmax")
            ],
            learning_rate=0.001,
            n_iter=25
        )
    }
