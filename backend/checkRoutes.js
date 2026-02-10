try {
    console.log('Checking authRoutes...'); require('./routes/authRoutes');
    console.log('Checking productRoutes...'); require('./routes/productRoutes');
    console.log('Checking repairRoutes...'); require('./routes/repairRoutes');
    console.log('Checking settingsRoutes...'); require('./routes/settingsRoutes');
    console.log('Checking orderRoutes...'); require('./routes/orderRoutes');
    console.log('Checking paymentRoutes...'); require('./routes/paymentRoutes');
    console.log('Checking userRoutes...'); require('./routes/userRoutes');
    console.log('Checking emailRoutes...'); require('./routes/emailRoutes');
    console.log('Checking statsRoutes...'); require('./routes/statsRoutes');
    console.log('Checking pageRoutes...'); require('./routes/pageRoutes');
    console.log('Checking accessoriesRoutes...'); require('./routes/accessoriesRoutes');
    console.log('Checking repairArchiveRoutes...'); require('./routes/repairArchiveRoutes');
    console.log('Checking valuationRoutes...'); require('./routes/valuationRoutes');
    console.log('Checking promotionsRoutes...'); require('./routes/promotionsRoutes');
    console.log('Checking reviewRoutes...'); require('./routes/reviewRoutes');
    console.log('Checking addressRoutes...'); require('./routes/addressRoutes');
    console.log('Checking transactionRoutes...'); require('./routes/transactionRoutes');
    console.log('Checking notificationRoutes...'); require('./routes/notificationRoutes');
    console.log('ALL ROUTES OK');
    process.exit(0);
} catch (e) {
    console.error('ERROR in route file:', e);
    process.exit(1);
}
