from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sknn.mlp import Classifier, Layer

# other splits for SVC kernel:
# linear, poly, rbf, sigmoid, precomputed

def makeClassifiers(globalArgs, dev):

    n_iter=15
    n_estimators=20
    # if(dev):
    #     n_iter=2
    #     n_estimators=5

    return {
        'clRfGini': RandomForestClassifier(n_estimators=n_estimators, n_jobs=globalArgs['numCPUs'], criterion='gini'),
        'clRfEntropy': RandomForestClassifier(n_estimators=n_estimators, n_jobs=globalArgs['numCPUs'], criterion='entropy'),
        'clSVCFirst': SVC(probability=True, shrinking=False),
        'clSVCShrinking': SVC(probability=True, shrinking=True),
        'clKnn': KNeighborsClassifier(),
        'clLogisticRegression': LogisticRegression(penalty='l2', dual=False, max_iter=1000),
        'clnnSknn': Classifier(
            layers=[
                Layer("Maxout", units=100, pieces=2),
                Layer("Softmax")
            ],
            learning_rate=0.001,
            n_iter=n_iter
        ),
        'clnnSknn3Layer': Classifier(
            layers=[
                Layer("Maxout", units=100, pieces=2),
                Layer("Maxout", units=100, pieces=2),
                Layer("Maxout", units=100, pieces=2),
                Layer("Softmax")
            ],
            learning_rate=0.001,
            n_iter=n_iter
        )
    }
