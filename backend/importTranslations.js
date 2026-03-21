const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const Translation = require('./models/Translation');

const flattenObject = (ob) => {
    let toReturn = {};
    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            let flatObject = flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
};

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const localesDir = path.join(__dirname, '../front-end/public/locales');
        const languages = ['de', 'en', 'ar', 'tr', 'ru', 'fa'];

        for (const lang of languages) {
            const filePath = path.join(localesDir, lang, 'translation.json');
            if (fs.existsSync(filePath)) {
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const flatData = flattenObject(fileData);

                for (const [key, value] of Object.entries(flatData)) {
                    await Translation.updateOne(
                        { key },
                        { $set: { [`values.${lang}`]: value } },
                        { upsert: true }
                    );
                }
                console.log(`Imported ${lang} translations successfully!`);
            }
        }

        console.log('All Translation Data Imported!');
        process.exit();
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importData();
