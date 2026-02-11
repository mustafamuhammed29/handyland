const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    // Use in-memory MongoDB for tests if possible, or mock it. 
    // For simplicity without installing mongo-memory-server right now (it's heavy), 
    // we will mock mongoose models in unit tests or use a test database if available.
    // Actually, unit tests should mock dependencies. Integration tests use a real DB.
    // Let's stick to unit testing controllers by mocking req, res, and models where possible,
    // OR use a test database connection if we want integration tests.

    // For this phase, let's focus on unit testing controllers with mocks to avoid DB dependency complexity.
    // So this setup file might just handle env vars.
    process.env.JWT_SECRET = 'test_secret';
    process.env.NODE_ENV = 'test';
});

afterAll(async () => {
    await mongoose.disconnect();
});
