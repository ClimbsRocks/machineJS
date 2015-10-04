module.exports = {
  average: function(arr) {
    var sum = arr.reduce(function(total,current) {
      return total + current;
    }, 0);
    return sum / arr.length;
  }
}
