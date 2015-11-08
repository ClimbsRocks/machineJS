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

## The Current State Of Advanced Options: 
- `--alreadyFormatted`: if your data has already been formatted. Useful if you're just tweaking parameters and don't want to repeat the oftentimes time-expensive data formatting process again. 
- `--kagglePredict`: see above (Format of Prediction File).
- `--dev`: This flag indicates that you are doing engineering work on ppComplete itself. It does things like:
  a) set the number of iterations to 1
  b) set the number of nets trained to 2
  c) if no data is passed in, automatically use the kaggleGiveCredit.csv dataset
- `--devKaggle`: Does all the same things as `--dev`, but also runs `--kagglePredict` on the default dataset kaggleGiveCreditTest.csv
- `--devEnsemble`: Assumes that we already have predictions made for us by the rest of the module and present in predictions/*.csv. Allows you to focus on assembling your ensemble without having to retrain the models each time :)


