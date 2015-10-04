module.exports = {
  average: function(arr) {
    var sum = arr.reduce(function(total,current) {
      return total + current;
    });
    return sum / arr.length;
  }
}
