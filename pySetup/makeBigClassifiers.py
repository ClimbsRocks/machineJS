from sklearn.ensemble import RandomForestClassifier
from sknn.mlp import Classifier, Layer
from sklearn.linear_model import SGDClassifier
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.neural_network import MLPClassifier

from sklearn.ensemble import RandomForestRegressor
from sknn.mlp import Regressor, Layer
from sklearn.ensemble import ExtraTreesRegressor


def makeAll(globalArgs, dev, problemType):
    estimator_count=1200
    if dev:
        estimator_count=120
        
    iterationCount=20
    if dev:
        iterationCount=2

    if problemType == 'category':
    
        return {
            'clRfGini': RandomForestClassifier(n_estimators=estimator_count, n_jobs=-1, criterion='gini'),
            'clRfBootstrapTrue': RandomForestClassifier(n_estimators=estimator_count, n_jobs=-1, bootstrap=True),
            'clRfEntropy': RandomForestClassifier(n_estimators=estimator_count, n_jobs=-1, criterion='entropy'),
            'clSGDClassifier': SGDClassifier(n_iter=iterationCount),
            'clExtraTrees': ExtraTreesClassifier(n_estimators=estimator_count, n_jobs=-1),
            'clnnSklearnMLP': MLPClassifier(max_iter=iterationCount*20),
            'clnnSknn': Classifier(
                layers=[
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Softmax")
                ],
                learning_rate=0.001,
                n_iter=iterationCount
            ),
            'clnnSknn3Layer': Classifier(
                layers=[
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Softmax")
                ],
                learning_rate=0.001,
                n_iter=iterationCount
            )
        }

    else:
    
        return {
            'clRfGini': RandomForestRegressor(n_estimators=estimator_count, n_jobs=-1),
            'clRfBootstrapTrue': RandomForestRegressor(n_estimators=estimator_count, n_jobs=-1, bootstrap=True),
            'clRfEntropy': RandomForestRegressor(n_estimators=estimator_count, n_jobs=-1),
            'clExtraTrees': ExtraTreesRegressor(n_estimators=estimator_count, n_jobs=-1),
            'clnnSknn': Regressor(
                layers=[
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Softmax")
                ],
                learning_rate=0.001,
                n_iter=iterationCount
            ),
            'clnnSknn3Layer': Regressor(
                layers=[
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Softmax")
                ],
                learning_rate=0.001,
                n_iter=iterationCount
            )
        }
