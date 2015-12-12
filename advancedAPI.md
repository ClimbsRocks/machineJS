# Advanced Options:

If you've done ML before, `machineJS` is incredibly useful in that it already puts in place most of the structure for all the parts of the process you have to repeat each time. 

As much as possible, we've tried to avoid hardcoding in values, instead allowing the user to pass in values, or setting default values if the user doesn't pass in any arguments. 

To get the best idea of all the options available to you, please check out `processArgs.js`. In the meantime, here are some of the more widely used options. 

- `--alreadyFormatted`: A boolean value 'true' or 'false', noting if your data has already been formatted. Useful if you're just tweaking parameters and don't want to repeat the oftentimes time-expensive data formatting process again. If you pass in this flag, make sure your files are included in the  `pySetup/testingFileNames.js` json list. I've included a couple of examples. You can get the fileNames from `pySetup/utils.js`, inside of the formatData function. Just copy paste the fileNames obj data-formatter gives to the callback, into the `testingFileNames.js` file, giving it a property of whatever the 'outputFileName' property is. You should be able to pick up the pattern pretty easily :)
- `--join`: a path to a data file that will be joined in with your training and testing data, in the same way you'd join SQL tables. 
- `--predict`: see above (Format of Prediction File).
- `--dev`: This flag indicates that you are doing engineering work on machineJS itself. It does things like:
  a) set the number of iterations to 1
  b) set the number of nets trained to 2
  c) if no data is passed in, automatically use the kaggleGiveCredit.csv dataset
- `--devKaggle`: Does all the same things as `--dev`, but also runs `--predict` on the default dataset kaggleGiveCreditTest.csv
- `--devEnsemble`: Assumes that we already have predictions made for us by the rest of the module and present in predictions/*.csv. Allows you to focus on assembling your ensemble without having to retrain the models each time :)
- `--dfOutputFolder`: if, for some reason, you want the results of `data-formatter` written to a different directory. We use this for the test suite, but it probably isn't useful for much other than that. 
- `--ensemblerOutputFolder`: much like the `dfOutputFolder` option above, you can choose to overwrite the default location for the output results. Used in our test suite, but probably not useful for many other cases.
- `--bestClassifiersFolder`: much like the `dfOutputFolder` option above, you can choose to overwrite the default location for the bestClassifier. Used in our test suite, but probably not useful for many other cases.

### Validation Splits
The `ensembler` module, which uses machine learning to aggregate together all the results of each trained algorithm, will always benefit from more information, and thus, more trained algorithms. 

To support this, we are using a consistent valdiation data split for a given test.csv dataset. This means you can change your training.csv data (new feature engineering, new ways of normalizing the data, etc.), but still use the predictions from previous training data sets. 

If you ever want to ask machineJS to create a new validation split for you, simply delete the `*validationData.npz` files from the data-formatterResults directory.

