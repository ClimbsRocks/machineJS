process.on('message', function(message) {
  console.log('[child] received message from server:', message);
  process.send('i love you back');
  while(true) {
    //do nothing, just chew through cpu to demonstrate it's working
  }
});