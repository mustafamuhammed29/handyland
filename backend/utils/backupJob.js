const cron = require('node-cron');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Run every day at 03:00 AM
const startBackupJob = () => {
    cron.schedule('0 3 * * *', async () => {
        console.log('[CRON] Starting Daily Database Backup...');
        try {
            const backupDir = path.join(__dirname, '..', 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const dailyDir = path.join(backupDir, `backup-${timestamp}`);
            fs.mkdirSync(dailyDir, { recursive: true });

            const models = mongoose.models;
            let successCount = 0;

            for (const modelName in models) {
                const Model = models[modelName];
                const data = await Model.find({}).lean();
                
                if (data && data.length > 0) {
                    const filePath = path.join(dailyDir, `${modelName}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    successCount++;
                }
            }

            console.log(`[CRON] Backup Completed Successfully. Saved ${successCount} collections to ${dailyDir}`);
        } catch (error) {
            console.error('[CRON] Backup Failed:', error);
        }
    });
    console.log('CRON: Backup job scheduled (Runs daily at 3:00 AM)');
};

module.exports = startBackupJob;
