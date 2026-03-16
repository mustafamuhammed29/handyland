const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/handyland')
  .then(() => {
    console.log('Connected');
    process.exit(0);
  })
  .catch(e => {
    require('fs').writeFileSync('err.txt', e.stack);
    console.error('Failed');
    process.exit(1);
  });
