require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const RepairTicket = require('./models/RepairTicket');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const tickets = await RepairTicket.find().sort({ createdAt: -1 }).limit(5);
        fs.writeFileSync('tickets-dump.json', JSON.stringify(tickets, null, 2));
        console.log("Done writing");
        process.exit(0);
    })
    .catch(err => {
        console.error("DB CON ERROR:", err);
        process.exit(1);
    });
