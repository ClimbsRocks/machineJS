var exec = require('child_process').execSync;

module.exports = function(controllerPython) {


  // kills off all the child processes if the parent process faces an uncaught exception and crashes. 
  // this prevents you from having zombie child processes running indefinitely.
  // lifted directly from: https://www.exratione.com/2013/05/die-child-process-die/
  // This is a somewhat ugly approach, but it has the advantage of working
  // in conjunction with most of what third parties might choose to do with
  // uncaughtException listeners, while preserving whatever the exception is.
  process.once("uncaughtException", function (error) {
    // If this was the last of the listeners, then shut down the child and rethrow.
    // Our assumption here is that any other code listening for an uncaught
    // exception is going to do the sensible thing and call process.exit().
    if (process.listeners("uncaughtException").length === 0) {
      console.log('we heard an unexpected shutdown event that is causing everything to close');
      controllerPython.killAll();
      throw error;
    }
  });

  if (process.platform === "win32") {
    var rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on("SIGINT", function () {
      process.emit("SIGINT");
    });
  }

  process.on("SIGINT", function () {
    //graceful shutdown
    console.log('heard sigint in machineJS')
    controllerPython.killAll();

    // if we hear a Ctrl + c, we can safely assume the user wants to exit. 
    // exec('pkill -9 node');
    process.exit();
  });

  process.on("killAll", function() {
    controllerPython.killAll();
    process.exit();

  });

};
