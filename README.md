# ppComplete
> a library for optimizing your ML algorithms

NOTE: This is still under active development, with Thanksgiving targeted for a release date. In the mean time, I'd love any PRs or feature requests you submit!

## How to use:
1. `npm install machinejs`
2. npm install
3. `node ppLib.js path/to/trainData.csv --kagglePredict path/to/testData.csv`

### Format of Data Files:
We use the `data-formatter` module to automatically format your data, and even perform some basic feature engineering on it. 
Please refer to their [docs](https://github.com/ClimbsRocks/data-formatter) for information on the tiny bit of preparation you need to do for your dataset to be ready for `machineJS`.


#### Note: This library is designed to run across all but one cores on the host machine. What this means for you:
1. Please plug in.
2. Close all programs and restart right before invoking (this will clear out as much RAM as possible).
3. Expect some noise from your fan- you're finally putting your computer to use!
4. Don't expect to be able to do anything intense while this is running. Internet browsing or code editing is fine, but watching a movie may get challenging.
5. Please don't run any other Python scripts while this is running.


# Refactor this entire section out into it's own file- keep README.md as pure and unintimidating as possible. 
## The Current State Of Advanced Options: 
- `--alreadyFormatted`: A boolean value 'true' or 'false', noting if your data has already been formatted. Useful if you're just tweaking parameters and don't want to repeat the oftentimes time-expensive data formatting process again. If you pass in this flag, make sure your files are included in the  `pySetup/testingFileNames.js` json list. I've included a couple of examples. You can get the fileNames from `pySetup/utils.js`, inside of the formatData function. Just copy paste the fileNames obj data-formatter gives to the callback, into the `testingFileNames.js` file. 
- `--join`: a path to a data file that will be joined in with your training and testing data, in the same way you'd join SQL tables. 
- `--kagglePredict`: see above (Format of Prediction File).
- `--dev`: This flag indicates that you are doing engineering work on ppComplete itself. It does things like:
  a) set the number of iterations to 1
  b) set the number of nets trained to 2
  c) if no data is passed in, automatically use the kaggleGiveCredit.csv dataset
- `--devKaggle`: Does all the same things as `--dev`, but also runs `--kagglePredict` on the default dataset kaggleGiveCreditTest.csv
- `--devEnsemble`: Assumes that we already have predictions made for us by the rest of the module and present in predictions/*.csv. Allows you to focus on assembling your ensemble without having to retrain the models each time :)
- `--dfOutputFolder`: if, for some reason, you want the results of `data-formatter` written to a different directory. We use this for the test suite, but it probably isn't useful for much other than that. 
- `--ensemblerOutputFolder`: much like the `dfOutputFolder` option above, you can choose to overwrite the default location for the output results. Used in our test suite, but probably not useful for many other cases.

### Validation Splits
The `ensembler` module, which uses machine learning to aggregate together all the results of each trained algorithm, will always benefit from more information, and thus, more trained algorithms. To support this, we are using a consistent valdiation data split for a given test.csv dataset. This means you can change your training.csv data (new feature engineering, new ways of normalizing the data, etc.), but still use the predictions from previous training data sets. 

If you ever want to ask machineJS to create a new validation split for you, simply delete the `*validationData.npz` files from the data-formatterResults directory.

