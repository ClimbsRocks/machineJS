from sklearn.ensemble import RandomForestClassifier
from sknn.mlp import Classifier, Layer

from sklearn.ensemble import RandomForestRegressor
from sknn.mlp import Regressor, Layer



def makeAll(globalArgs, dev, problemType):
    estimator_count=1200
    if dev:
        estimator_count=120
        
    iterationCount=100
    if dev:
        iterationCount=2

    if problemType == 'category':
    
        return {
            'clRfGini': RandomForestClassifier(n_estimators=estimator_count, n_jobs=globalArgs['numCPUs'], criterion='gini'),
            'clRfEntropy': RandomForestClassifier(n_estimators=estimator_count, n_jobs=globalArgs['numCPUs'], criterion='entropy'),
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
            'clRfGini': RandomForestRegressor(n_estimators=estimator_count, n_jobs=globalArgs['numCPUs']),
            'clRfEntropy': RandomForestRegressor(n_estimators=estimator_count, n_jobs=globalArgs['numCPUs']),
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
