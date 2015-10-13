# Advanced Customizations

There are many parameters throughout this project that you may want to chage. 
You are, in fact, highly encouraged to customize this for your own particular use! 
The project is designed to be modular and well-documented enough that it should be pretty easy to understand where to go to find different values you might want to change. 

As a rough guide, here are some of those values you might cusotmize:
imputed values:
  what is considered a missing value in your dataset?
  what should missing values be replaced by? (mean, median, most common value for that column, etc.)
If you are using a neural network that takes values from -1 to 1, we are currently assuming values from 0 to 1

You may want a different form of feature selection
  particularly, if you care about having a describable output. right now our algo focuses on selecting the best features automatically, which uses rfecv, a method which will generally only choose one of a set of highly correlated features. in this way, if say age and income are both highly predictive, but both highly correlated to each other, the feature selection routine will pick only one of them, making one of them appear important, while the other looks unuseful for predicting. 




