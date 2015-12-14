
# install all Node.js dependencies using npm
npm install
# if pip is not installed, install it using the instructions at: https://pip.pypa.io/en/stable/installing/

wget https://bootstrap.pypa.io/get-pip.py
python get-pip.py

pip install joblib
pip install numpy
pip install pandas
pip install scipy
pip install cython
pip install xgboost
pip install python-dateutil


# once we're working off the latest stable release, we'll be able to install sklearn through pip:
# pip install sklearn

# however, at the moment, we're using features not yet included in the most recent release, so we have to install directly from GitHub:
git clone https://github.com/scikit-learn/scikit-learn.git
cd scikit-learn
python setup.py build
sudo python setup.py install

