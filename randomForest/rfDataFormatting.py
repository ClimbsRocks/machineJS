# read the data in so that each line is a dict
  # ideally python would do this for us directly, knowing the column headers. but if it doesn't, we could do it super easily ourselves (read in the row as a list, read in the column headers as the first row as a list, create an object as we go where we look up the feature_name by the current position within the first row)
  # update: python does it for us:
    # https://docs.python.org/3/library/csv.html#csv.DictReader
# run DictVectorizer on it!
  # http://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.DictVectorizer.html
  # this handles binarizing as well as keeping track of the order while turning it into a list and such. this should do all we need it to. 
# possibly write this to file somewhere, rather than having to run this for each new python child_process we spin up? 
import sys
import csv


fileName = sys.argv[1]
print fileName
with open(fileName, 'rU') as csvInput:
    csvRows = csv.DictReader(csvInput)
    for row in csvRows:
        print row

