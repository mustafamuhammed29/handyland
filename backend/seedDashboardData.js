require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const RepairTicket = require('./models/RepairTicket');
const SavedValuation = require('./models/SavedValuation');
const Transaction = require('./models/Transaction');
const Address = require('./models/Address');

const seedDashboardData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Find test user
        const testUser = await User.findOne({ email: 'customer@handyland.com' });
        if (!testUser) {
            console.error('Test user not found. Run seedCustomer.js first!');
            process.exit(1);
        }

        console.log(`Seeding data for user: ${testUser.email}`);

        // Clear existing data for this user
        await Order.deleteMany({ user: testUser._id });
        await RepairTicket.deleteMany({ user: testUser._id });
        await SavedValuation.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await Address.deleteMany({ user: testUser._id });

        // Seed Addresses
        const addresses = await Address.create([
            {
                user: testUser._id,
                street: 'Hauptstraße 123',
                city: 'Berlin',
                state: 'BE',
                zipCode: '10115',
                country: 'Germany',
                isDefault: true
            },
            {
                user: testUser._id,
                street: 'Wilhelmstraße 45',
                city: 'Munich',
                state: 'BY',
                zipCode: '80331',
                country: 'Germany',
                isDefault: false
            }
        ]);
        console.log(`✅ Created ${addresses.length} addresses`);

        // Seed Orders (manual orderNumber to avoid hook issues)
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now();

        const order1 = new Order({
            orderNumber: `HL-${year}${month}${day}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
            user: testUser._id,
            items: [
                {
                    product: new mongoose.Types.ObjectId(),
                    productType: 'Product',
                    name: 'iPhone 14 Pro',
                    price: 899,
                    quantity: 1
                }
            ],
            totalAmount: 899,
            status: 'delivered',
            paymentMethod: 'card',
            paymentStatus: 'paid',
            shippingAddress: {
                fullName: testUser.name,
                email: testUser.email,
                phone: '+491234567890',
                street: addresses[0].street,
                city: addresses[0].city,
                state: addresses[0].state,
                zipCode: addresses[0].zipCode,
                country: addresses[0].country
            }
        });
        await order1.save();

        const order2 = new Order({
            orderNumber: `HL-${year}${month}${day}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
            user: testUser._id,
            items: [
                {
                    product: new mongoose.Types.ObjectId(),
                    productType: 'Product',
                    name: 'iPad Pro 11"',
                    price: 749,
                    quantity: 1
                }
            ],
            totalAmount: 749,
            status: 'processing',
            paymentMethod: 'paypal',
            paymentStatus: 'paid',
            shippingAddress: {
                fullName: testUser.name,
                email: testUser.email,
                phone: '+491234567890',
                street: addresses[0].street,
                city: addresses[0].city,
                state: addresses[0].state,
                zipCode: addresses[0].zipCode,
                country: addresses[0].country
            }
        });
        await order2.save();

        const orders = [order1, order2];
        console.log(`✅ Created ${orders.length} orders`);

        // Seed Repair Tickets
        const tickets = await RepairTicket.create([
            {
                user: testUser._id,
                device: 'iPhone 13',
                issue: 'Screen replacement',
                notes: 'Cracked screen needs replacement',
                status: 'in_progress',
                serviceType: 'repair',
                estimatedCost: 199
            },
            {
                user: testUser._id,
                device: 'MacBook Pro',
                issue: 'Battery replacement',
                notes: 'Battery drains quickly',
                status: 'pending',
                serviceType: 'repair',
                appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        ]);
        console.log(`✅ Created ${tickets.length} repair tickets`);

        // Seed Valuations
        const valuations = await SavedValuation.create([
            {
                user: testUser._id,
                device: 'iPhone 12 Pro',
                condition: 'excellent',
                storage: '256GB',
                estimatedValue: 450,
                status: 'saved'
            },
            {
                user: testUser._id,
                device: 'iPad Air',
                condition: 'good',
                storage: '128GB',
                estimatedValue: 280,
                status: 'saved'
            }
        ]);
        console.log(`✅ Created ${valuations.length} valuations`);

        // Seed Transactions
        const transactions = await Transaction.create([
            {
                user: testUser._id,
                type: 'credit',
                amount: 100,
                description: 'Initial wallet credit',
                status: 'completed'
            },
            {
                user: testUser._id,
                type: 'debit',
                amount: 25,
                description: 'Used for purchase',
                status: 'completed'
            }
        ]);
        console.log(`✅ Created ${transactions.length} transactions`);

        console.log('\n🎉 Dashboard data seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Addresses: ${addresses.length}`);
        console.log(`   - Orders: ${orders.length}`);
        console.log(`   - Repair Tickets: ${tickets.length}`);
        console.log(`   - Valuations: ${valuations.length}`);
        console.log(`   - Transactions: ${transactions.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding dashboard data:', error);
        process.exit(1);
    }
};

seedDashboardData();
