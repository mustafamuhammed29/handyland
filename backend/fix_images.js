const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fix() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland');
    const db = client.db();

    await db.collection('products').updateMany(
      { image: { $regex: '^http://' } },
      [{
        $set: {
          image: {
            $replaceOne: {
              input: "$image",
              find: "http://127.0.0.1:5000",
              replacement: ""
            }
          }
        }
      }]
    );

    await db.collection('repairdevices').updateMany(
      { image: { $regex: '^http://' } },
      [{
        $set: {
          image: {
            $replaceOne: {
              input: "$image",
              find: "http://127.0.0.1:5000",
              replacement: ""
            }
          }
        }
      }]
    );
    console.log("Fixed image paths successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
