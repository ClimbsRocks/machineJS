# machineJS
> a fully-featured default process for machine learning- all the parts are here and have functional default values in place. Modify to your heart's delight so you can focus on the important parts for your dataset, or run it all the way through with the default values to have fully automated machine learning!

## What is it?
`machineJS` provides a fully automated framework for applying machine learning to a dataset.

All you have to do is give it a .csv file, with some basic information about each column in the first row, and it will go off and do all the machine learning for you!

If you've already done this kind of thing before, it's useful as an outline, putting in place a working structure for you to make modifications within, rather than having to build from scratch again every time. 

machineJS will tell you:
- Which algorithms are going to be most effective for this problem 
- Which features are most useful
- Whether this problem is solvable by machine learning at all (useful if you're not sure you've collected enough data yet)
- How effective machine learning can be with this problem, to compare against other potential solutions (like just taking a grouped average)

If you haven't done much (or any) machine learning before- it does some fairly advanced stuff for you!

## Installation:

### As a standalone directory (recommended)
If you want to install this in it's own standalone repo, and work on the source code directly, then from the command line, type the following:
1. `git clone https://github.com/ClimbsRocks/machineJS.git`
2. `cd machineJS`
3. `npm install`
4. `installPythonDependencies.sh`

### As a node_module
If you are installing this as a node_module to be used within another repo:
1. `npm install --save machinejs`
2. `cd node_modules/machinejs`
3. `installPythonDependencies.sh`

## How to use
You can use machineJS either from the command line, or as a node module by requiring it into files being run by node.js.

### From the command line
`node machineJS.js path/to/trainData.csv --predict path/to/testData.csv`

### As a node_module
``` 
var machineJS = require('machinejs');
machineJS({
  dataFile: 'path/to/trainData.csv',
  predict: 'path/to/testData.csv'
});
```

## Format of Data Files:
We use the `data-formatter` module to automatically format your data, and even perform some basic feature engineering on it. 
Please refer to `data-formatter`'s [docs](https://github.com/ClimbsRocks/data-formatter) for information on the tiny bit of preparation you need to do for your dataset to be ready for `machineJS`.

## What types of problems does this library work on?
`machineJS` works on both regression and categorical problems, as long as there is a single output column in the training data. This includes multi-category (frequently called multi-class) problems, where the category you are predicting is one of many possible categories. 
There are no immediate plans to support multiple output columns in the training data. If you have three output columns you're interested in predicting, and they cannot be combined into a single column in the training data, you could run `machineJS` once for each of those three columns. 


#### Note: This library is designed to run across all but one cores on the host machine. What this means for you:
1. Please plug in.
2. Close all programs and restart right before invoking (this will clear out as much RAM as possible).
3. Expect some noise from your fan- you're finally putting your computer to use!
4. Don't expect to be able to do anything intense while this is running. Internet browsing or code editing is fine, but watching a movie may get challenging.
5. Please don't run any other Python scripts while this is running.

Thanks for inviting us along on your machine learning journey!



