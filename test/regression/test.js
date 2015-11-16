global.rTest = {};
var expect = require('chai').expect;
var mocha = require('mocha');
var path = require('path');
var fs = require('fs');

var makePredictions = require('./makePredictions');
var splitDataset = require('./splitDataset');
var trainAlgorithms = require('./trainAlgorithms');
var deleteRemnantsAndRunNewTest = require('./deleteRemnantsAndRunNewTest');


// this block will contain all the tests for the entire data-formatter package
describe('regression problems', function() {
  // this timeout should be long enough to handle tests on a variety of machines. If you are getting a timeout error, consider bumping this up even more. 
  this.timeout(600000);

  rTest.startTime = Date.now();

  before(deleteRemnantsAndRunNewTest);


  // TODO: run this separately for each type of problem we're solving (regression, category, then eventually multi-labe, etc.)

  // setDefaultArgs();

  trainAlgorithms();

  makePredictions();

  splitDataset();

});
