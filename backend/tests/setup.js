// Set mock environment variables before any files are required
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = 'test_service_key';

// Mock UUID to avoid ESM 'export' syntax errors in Jest
jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => 'test-uuid-1234')
    };
});

// Mock Supabase to avoid hitting real database during isolated tests
jest.mock('../config/supabase', () => {
    return {
        supabaseAdmin: {
            auth: {
                admin: {
                    createUser: jest.fn(),
                    deleteUser: jest.fn(),
                    updateUserById: jest.fn(),
                    listUsers: jest.fn(),
                    generateLink: jest.fn().mockResolvedValue({ data: { properties: { action_link: 'http://test' } }, error: null }),
                    getUserById: jest.fn()
                },
                exchangeCodeForSession: jest.fn(),
                refreshSession: jest.fn(),
                getUser: jest.fn(),
                signInWithPassword: jest.fn().mockResolvedValue({ data: { session: { access_token: 'fake-token' }, user: { id: 'test-id' } }, error: null })
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                upsert: jest.fn().mockReturnThis(),
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                neq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                gt: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 'test-id', is_active: true, role: 'admin' }, error: null }),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis(),
                then: function(resolve) { resolve({ data: [], error: null }); }
            }))
        },
        createAuthClient: jest.fn(() => {
            if (!global.__mockAuthClient) {
                global.__mockAuthClient = {
                    auth: {
                        signInWithPassword: jest.fn(),
                        exchangeCodeForSession: jest.fn(),
                        refreshSession: jest.fn(),
                        getUser: jest.fn()
                    }
                };
            }
            return global.__mockAuthClient;
        }),
        uploadImage: jest.fn().mockResolvedValue('https://test.supabase.co/storage/v1/object/public/products/test.webp'),
        deleteImage: jest.fn().mockResolvedValue(),
        uploadHeroVideoFile: jest.fn().mockResolvedValue('https://test.supabase.co/storage/v1/object/public/media/hero/test.mp4')
    };
});

// Global teardown hook for defense-in-depth
afterAll(async () => {
    try {
        const { stopCronJobs } = require('../services/cronService');
        if (typeof stopCronJobs === 'function') {
            stopCronJobs();
        }
    } catch (e) {
        // cronService was not loaded during this test suite; safe to ignore
    }

    try {
        const cron = require('node-cron');
        if (cron && typeof cron.getTasks === 'function') {
            const tasks = cron.getTasks();
            if (tasks && typeof tasks.forEach === 'function') {
                tasks.forEach(task => {
                    try {
                        if (task && typeof task.stop === 'function') {
                            task.stop();
                        }
                    } catch (err) {
                        // Task was already stopped
                    }
                });
            }
        }
    } catch (e) {
        // node-cron was not loaded
    }

    try {
        const { closeSocket } = require('../utils/socket');
        if (typeof closeSocket === 'function') {
            await closeSocket();
        }
    } catch (e) {
        // socket module was not loaded
    }
});
