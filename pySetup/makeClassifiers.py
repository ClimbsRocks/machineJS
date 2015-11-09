from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import AdaBoostClassifier
from sknn.mlp import Classifier, Layer

import xgboost

from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.ensemble import AdaBoostRegressor
from sklearn.svm import SVR
from sknn.mlp import Regressor, Layer
from sklearn.linear_model import LinearRegression

# other splits for SVC kernel:
# linear, poly, rbf, sigmoid, precomputed

def makeClassifiers(globalArgs, dev, problemType):

    n_iter=10
    n_estimators=20
    if(dev):
        n_iter=2
        n_estimators=5

    if problemType == 'category':
        return {
            'clRfGini': RandomForestClassifier(n_estimators=n_estimators, n_jobs=1, criterion='gini'),
            'clRfEntropy': RandomForestClassifier(n_estimators=n_estimators, n_jobs=1, criterion='entropy'),
            'clSVCFirst': SVC(probability=True, shrinking=False),
            'clSVCShrinking': SVC(probability=True, shrinking=True),
            'clKnn': KNeighborsClassifier(),
            'clLogisticRegression': LogisticRegression(penalty='l2', dual=False, max_iter=1000),
            'clAdaBoost': AdaBoostClassifier(),
            'clXGBoost': xgboost.XGBClassifier(),
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

    # Regression models
    else:
        return {
            'clRfGini': RandomForestRegressor(n_estimators=n_estimators, n_jobs=1),
            # 'clRfEntropy': RandomForestRegressor(n_estimators=n_estimators, n_jobs=1, criterion='entropy'),
            'clSVCFirst': SVR(shrinking=False),
            'clSVCShrinking': SVR(shrinking=True),
            'clKnn': KNeighborsRegressor(),
            'clLogisticRegression': LinearRegression(),
            'clAdaBoost': AdaBoostRegressor(),
            'clXGBoost': xgboost.XGBRegressor(),
            'clnnSknn': Regressor(
                layers=[
                    Layer("Maxout", units=100, pieces=2),
                    Layer("Softmax")
                ],
                learning_rate=0.001,
                n_iter=n_iter
            ),
            'clnnSknn3Layer': Regressor(
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
