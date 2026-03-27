const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    const admin = await User.findOne({ role: 'admin' });
    console.log("Admin Avatar:", admin?.avatar);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
