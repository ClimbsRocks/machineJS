import scipy
import numpy as np

def makeParams(X, y, globalArgs, dev, problemType):



# great overall walkthrough of xgb. probably the best starting point.
    # http://www.slideshare.net/ShangxuanZhang/kaggle-winning-solution-xgboost-algorithm-let-us-learn-from-its-author


# list of params that can be tuned:
    # https://www.kaggle.com/forums/f/15/kaggle-forum/t/17120/how-to-tuning-xgboost-in-an-efficient-way


# discussion by xgb library itself:
    # https://github.com/dmlc/xgboost/blob/master/doc/param_tuning.md

    # other parameters to investigate that might only exist in the sklearn implementation:
        # learning_rate
        # n_estimators (i have a feeling this is num_boost_round)
        # subsample
        # max_features

    # Other params to invesigat:
        # Split on:
            # booster [default=gbtree]
                # which booster to use, can be gbtree or gblinear. gbtree uses tree based model while gblinear uses linear function.

# param_space = {'max_depth': [2,4,6,8,10], 'n_estimators': [200,300,400,500,600,700,800], 'learning_rate' : uniform(loc=0.001,scale=0.2), 'subsample': uniform(loc=0.6,scale=0.39), 'colsample_bytree':uniform(loc=0.6,scale=0.39), }

# param_dist = {
#     'max_depth': randint(2, 8),
#     'gamma': uniform(0.2, 0.6),
#     'subsample': beta(10, 1),
# }
# and then do a randomized grid search like this

# clf = xgb.XGBClassifier(n_estimators = 20)
# n_iter_search = 100
# random_search = RandomizedSearchCV(clf, param_distributions=param_dist, n_iter=n_iter_search, scoring='roc_auc', verbose=10)
# random_search.fit(X_train, y_train)



# {'max_depth': [2,4,6],
#                     'n_estimators': [50,100,200]}

# official docs:
    # https://github.com/dmlc/xgboost/blob/master/doc/parameter.md

# samuel reuther had a good reply:
    # https://www.kaggle.com/c/otto-group-product-classification-challenge/forums/t/13910/xgboost-parameter-tuning

# forum that talks about specific numbers:
# https://www.kaggle.com/c/otto-group-product-classification-challenge/forums/t/12947/achieve-0-50776-on-the-leaderboard-in-a-minute-with-xgboost/76028

# slide 12 has exact param recommendations:
    # http://www.slideshare.net/odsc/owen-zhangopen-sourcetoolsanddscompetitions1

        



    # RandomSearchCV parameters:
    parameters_to_try = {
        'max_depth': scipy.stats.randint(1,150),
        'subsample': np.random.uniform(.80,1,1000),
        'colsample_bytree': np.random.uniform(.80,1,1000)
    }

    # TODO: create two separate XGBoosts, one for gbtree adn one for gblinear
    # 'booster': ['gbtree','gblinear']

    if dev:
        parameters_to_try.pop('subsample', None)
        parameters_to_try.pop('colsample_bytree', None)
        # parameters_to_try.pop('num_round', None)
        # parameters_to_try.pop('eta', None)
        
    return parameters_to_try
