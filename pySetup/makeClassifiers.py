from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sknn.mlp import Classifier, Layer

# other splits for SVC kernel:
# linear, poly, rbf, sigmoid, precomputed

# TODO: see what we can remove from clnnSknn. it complains if we don't pass in enough arguments, but i'm not sure which of these are required and which are not
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
        'clnnSknn': Classifier(
            layers=[
                Layer("Maxout", units=100),
                Layer("Softmax")
            ],
            learning_rate=0.001,
            n_iter=n_iter
        ),
        'clnnSknn3Layer': Classifier(
            layers=[
                Layer("Maxout", units=100),
                Layer("Maxout", units=100),
                Layer("Maxout", units=100),
                Layer("Softmax")
            ],
            learning_rate=0.001,
            n_iter=n_iter
        )
    }
