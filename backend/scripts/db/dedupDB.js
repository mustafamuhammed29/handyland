const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/handyland').then(async () => {
    try {
        const RepairDevice = require('./models/RepairDevice');

        // Find and delete duplicate repair devices (keeping the newest one)
        // Group by model as the device names are stored in the model property
        const duplicates = await RepairDevice.aggregate([
            { $group: { _id: '$model', ids: { $push: '$_id' }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log(`Found ${duplicates.length} duplicate models.`);

        for (const dup of duplicates) {
            // Check if the _id is not null just in case
            if (!dup._id) continue;
            // keep the last one (newest). The ids array contains _ids. 
            // We slice from 0 to length - 1, meaning we take all elements except the last one, to be removed.
            const remove = dup.ids.slice(0, dup.ids.length - 1);
            console.log(`Removing ${remove.length} duplicates for ${dup._id}`);
            await RepairDevice.deleteMany({ _id: { $in: remove } });
        }

        console.log('Duplicates removed successfully!');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
