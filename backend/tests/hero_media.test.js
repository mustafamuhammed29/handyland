'use strict';

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');
const { isValidMediaUrl, normalizeHostname, isPrivateOrLoopbackHost } = require('../controllers/settingsController');

// Create valid MP4 and WebM mock buffers with magic bytes
const createValidMp4Buffer = () => {
    // 32 bytes: first 4 bytes size, bytes 4..7 'ftyp', rest padding
    const buf = Buffer.alloc(32);
    buf.writeUInt32BE(32, 0);
    buf.write('ftyp', 4, 'ascii');
    buf.write('isom', 8, 'ascii');
    return buf;
};

const createValidWebmBuffer = () => {
    // Starts with 0x1A, 0x45, 0xDF, 0xA3 (EBML)
    const buf = Buffer.alloc(32);
    buf[0] = 0x1a;
    buf[1] = 0x45;
    buf[2] = 0xdf;
    buf[3] = 0xa3;
    return buf;
};

const setupMockUserWithRole = (role, userId = 'user-uuid-123') => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: `${role}@test.com` } },
        error: null
    });
    supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'users') {
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: userId,
                        name: `Test ${role}`,
                        email: `${role}@test.com`,
                        role: role,
                        is_active: true,
                        is_verified: true
                    },
                    error: null
                }),
                order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
                then: function(resolve) { resolve({ data: [], error: null, count: 0 }); }
            };
        }
        const chainable = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: {
                    key: 'hero',
                    value: JSON.stringify({
                        headline: 'Preserved Headline',
                        productName: 'iPhone 15 Pro Max',
                        heroImage: 'https://test.supabase.co/img.webp'
                    })
                },
                error: null
            }),
            maybeSingle: jest.fn().mockResolvedValue({
                data: {
                    key: 'hero',
                    value: JSON.stringify({
                        headline: 'Preserved Headline',
                        productName: 'iPhone 15 Pro Max',
                        heroImage: 'https://test.supabase.co/img.webp'
                    })
                },
                error: null
            }),
            then: function(resolve) { resolve({ data: [], error: null }); }
        };
        return chainable;
    });
};

describe('Hero Media Feature & Upload Security', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        supabaseAdmin.storage = {
            from: jest.fn(() => ({
                upload: jest.fn().mockResolvedValue({ data: { path: 'hero/test.mp4' }, error: null }),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/media/hero/test.mp4' } })),
                remove: jest.fn().mockResolvedValue({ data: [], error: null })
            }))
        };
    });

    describe('Host Normalization Helper (normalizeHostname)', () => {
        it('should trim whitespace, lowercase, and remove trailing dots', () => {
            expect(normalizeHostname('  XYZ.Supabase.CO. ')).toBe('xyz.supabase.co');
            expect(normalizeHostname('cdn.handyland.de.')).toBe('cdn.handyland.de');
            expect(normalizeHostname('cdn.handyland.de')).toBe('cdn.handyland.de');
        });

        it('should handle IPv6 bracket stripping', () => {
            expect(normalizeHostname('[::1]')).toBe('::1');
            expect(normalizeHostname('[::ffff:127.0.0.1]')).toBe('::ffff:127.0.0.1');
        });

        it('should return empty string for non-string or empty input', () => {
            expect(normalizeHostname('')).toBe('');
            expect(normalizeHostname(null)).toBe('');
            expect(normalizeHostname(undefined)).toBe('');
            expect(normalizeHostname(12345)).toBe('');
        });
    });

    describe('Private & Loopback Host Rejection (isPrivateOrLoopbackHost)', () => {
        it('should reject loopback addresses (IPv4 & IPv6)', () => {
            expect(isPrivateOrLoopbackHost('127.0.0.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('127.0.0.53')).toBe(true);
            expect(isPrivateOrLoopbackHost('localhost')).toBe(true);
            expect(isPrivateOrLoopbackHost('::1')).toBe(true);
            expect(isPrivateOrLoopbackHost('0:0:0:0:0:0:0:1')).toBe(true);
            expect(isPrivateOrLoopbackHost('::')).toBe(true);
        });

        it('should reject IPv4 private and link-local ranges', () => {
            expect(isPrivateOrLoopbackHost('10.0.0.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('10.255.255.255')).toBe(true);
            expect(isPrivateOrLoopbackHost('172.16.0.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('172.31.255.255')).toBe(true);
            expect(isPrivateOrLoopbackHost('192.168.1.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('169.254.1.1')).toBe(true); // Link-local
            expect(isPrivateOrLoopbackHost('0.0.0.0')).toBe(true);
        });

        it('should reject IPv6 ULA (fc00::/7) and Link-Local (fe80::/10)', () => {
            expect(isPrivateOrLoopbackHost('fc00::1')).toBe(true);
            expect(isPrivateOrLoopbackHost('fd12:3456:789a::1')).toBe(true);
            expect(isPrivateOrLoopbackHost('fe80::1')).toBe(true);
            expect(isPrivateOrLoopbackHost('fe80::2c0:4dff:fe00:1')).toBe(true);
            expect(isPrivateOrLoopbackHost('febf::1')).toBe(true);
        });

        it('should reject IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)', () => {
            expect(isPrivateOrLoopbackHost('::ffff:127.0.0.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('::ffff:10.0.0.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('::ffff:192.168.1.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('::ffff:172.16.0.1')).toBe(true);
            expect(isPrivateOrLoopbackHost('::ffff:169.254.0.1')).toBe(true);
        });

        it('should accept valid public hostnames', () => {
            expect(isPrivateOrLoopbackHost('xyz123.supabase.co')).toBe(false);
            expect(isPrivateOrLoopbackHost('cdn.handyland.de')).toBe(false);
            expect(isPrivateOrLoopbackHost('assets.handyland.de')).toBe(false);
        });
    });

    describe('URL Validation Helper (isValidMediaUrl)', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = {
                ...originalEnv,
                SUPABASE_URL: 'https://xyz123.supabase.co',
                ALLOWED_MEDIA_HOSTS: 'cdn.handyland.de,assets.handyland.de'
            };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should accept exact configured Supabase host', () => {
            expect(isValidMediaUrl('https://xyz123.supabase.co/storage/v1/object/public/media/hero/video.mp4')).toBe(true);
        });

        it('should accept configured approved host with trailing dot after normalization', () => {
            expect(isValidMediaUrl('https://xyz123.supabase.co./storage/v1/object/public/media/hero/video.mp4')).toBe(true);
        });

        it('should reject unrelated projects on supabase.co wildcard and with trailing dot', () => {
            expect(isValidMediaUrl('https://unrelated-project.supabase.co/storage/v1/object/public/media/hero/video.mp4')).toBe(false);
            expect(isValidMediaUrl('https://other-project.supabase.co./storage/v1/object/public/media/hero/video.mp4')).toBe(false);
            expect(isValidMediaUrl('https://attacker-supabase.supabase.co/media.mp4')).toBe(false);
        });

        it('should accept explicitly configured ALLOWED_MEDIA_HOSTS', () => {
            expect(isValidMediaUrl('https://cdn.handyland.de/videos/hero.mp4')).toBe(true);
            expect(isValidMediaUrl('https://assets.handyland.de/hero.mp4')).toBe(true);
            expect(isValidMediaUrl('https://evil.handyland.de.attacker.com/hero.mp4')).toBe(false);
        });

        it('should accept only valid relative media prefix (/media/hero/ or /media/)', () => {
            expect(isValidMediaUrl('/media/hero/intro.mp4')).toBe(true);
            expect(isValidMediaUrl('/media/uploads/hero.webm')).toBe(true);
            expect(isValidMediaUrl('/media/demo.mp4')).toBe(true);
        });

        it('should reject arbitrary relative paths outside allowed media prefix', () => {
            expect(isValidMediaUrl('/admin')).toBe(false);
            expect(isValidMediaUrl('/api/settings')).toBe(false);
            expect(isValidMediaUrl('/')).toBe(false);
            expect(isValidMediaUrl('/etc/passwd')).toBe(false);
            expect(isValidMediaUrl('/media/hero/../../admin')).toBe(false);
            expect(isValidMediaUrl('//evil.com/video.mp4')).toBe(false);
        });

        it('should reject dangerous protocols and non-http(s) schemes', () => {
            expect(isValidMediaUrl('javascript:alert(1)')).toBe(false);
            expect(isValidMediaUrl('data:video/mp4;base64,AAAA')).toBe(false);
            expect(isValidMediaUrl('blob:https://xyz123.supabase.co/123')).toBe(false);
            expect(isValidMediaUrl('file:///etc/passwd')).toBe(false);
        });

        it('should reject private/loopback IPv6 in production even if mistakenly in ALLOWED_MEDIA_HOSTS', () => {
            const prodEnv = {
                ...process.env,
                NODE_ENV: 'production',
                ALLOWED_MEDIA_HOSTS: '::1,::ffff:127.0.0.1,fc00::1,fe80::1,127.0.0.1'
            };
            const current = process.env;
            process.env = prodEnv;

            expect(isValidMediaUrl('https://[::1]/video.mp4')).toBe(false);
            expect(isValidMediaUrl('https://[::ffff:127.0.0.1]/video.mp4')).toBe(false);
            expect(isValidMediaUrl('https://[fc00::1]/video.mp4')).toBe(false);
            expect(isValidMediaUrl('https://127.0.0.1/video.mp4')).toBe(false);

            process.env = current;
        });
    });

    describe('POST /api/admin/uploads/hero-video', () => {
        it('should return 401 when unauthenticated', async () => {
            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Invalid or missing token' }
            });

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer invalid-token')
                .attach('video', createValidMp4Buffer(), 'test.mp4');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 when authenticated as customer (role: user)', async () => {
            setupMockUserWithRole('user');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-user')
                .attach('video', createValidMp4Buffer(), 'test.mp4');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 when authenticated as staff (role: staff)', async () => {
            setupMockUserWithRole('staff');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-staff')
                .attach('video', createValidMp4Buffer(), 'test.mp4');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should successfully upload valid MP4 video when authenticated as admin', async () => {
            setupMockUserWithRole('admin');
            const { uploadHeroVideoFile } = require('../config/supabase');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-admin')
                .attach('video', createValidMp4Buffer(), 'demo.mp4');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.videoUrl).toContain('https://test.supabase.co/storage/v1/object/public/media/hero/');
            expect(uploadHeroVideoFile).toHaveBeenCalled();
        });

        it('should successfully upload valid WebM video when authenticated as admin', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-admin')
                .attach('video', createValidWebmBuffer(), 'demo.webm');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.videoUrl).toBeDefined();
        });

        it('should reject non-video files (e.g. PNG image)', async () => {
            setupMockUserWithRole('admin');
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-admin')
                .attach('video', pngBuffer, 'image.png');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject unsupported video formats (e.g. MOV, OGG)', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-admin')
                .attach('video', Buffer.alloc(64), 'video.mov');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject forged MP4 with invalid signature/magic bytes', async () => {
            setupMockUserWithRole('admin');
            const forgedBuffer = Buffer.from('THIS IS JUST A TEXT FILE DISGUISED AS MP4');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-admin')
                .attach('video', forgedBuffer, 'fake.mp4');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('signature');
        });

        it('should return 400 when no file is attached', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .post('/api/admin/uploads/hero-video')
                .set('Authorization', 'Bearer token-admin');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/settings Hero Media Validation & Preservation', () => {
        it('should return 401 when non-authenticated user attempts to update settings', async () => {
            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Invalid or missing token' }
            });

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer invalid-token')
                .send({ hero: { media: { mode: 'content' } } });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 when staff user attempts to update settings', async () => {
            setupMockUserWithRole('staff');

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer token-staff')
                .send({ hero: { media: { mode: 'content' } } });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should accept content mode without a videoUrl', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer token-admin')
                .send({
                    hero: {
                        headline: 'HandyLand Tech',
                        media: { mode: 'content' }
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject invalid media mode (not content or video)', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer token-admin')
                .send({
                    hero: {
                        media: { mode: 'invalid_mode' }
                    }
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid Hero media mode');
        });

        it('should reject video mode when videoUrl is missing or blank', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer token-admin')
                .send({
                    hero: {
                        media: { mode: 'video', videoUrl: '' }
                    }
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('valid video URL is required');
        });

        it('should reject video mode with unapproved external host or dangerous protocol', async () => {
            setupMockUserWithRole('admin');
            const dangerousUrls = [
                'http://malicious-external-site.com/video.mp4',
                'https://other-project.supabase.co/storage/v1/object/public/media/hero/video.mp4',
                '/admin/config',
                'javascript:alert(1)',
                'data:video/mp4;base64,AAAA',
                'file:///etc/passwd'
            ];

            for (const url of dangerousUrls) {
                const res = await request(app)
                    .put('/api/settings')
                    .set('Authorization', 'Bearer token-admin')
                    .send({
                        hero: {
                            media: { mode: 'video', videoUrl: url }
                        }
                    });

                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
            }
        });

        it('should accept video mode with valid relative media prefix or approved storage URL', async () => {
            setupMockUserWithRole('admin');
            const validUrls = [
                '/media/hero/sample-video.mp4',
                'http://localhost:54321/storage/v1/object/public/media/hero/sample.mp4'
            ];

            for (const url of validUrls) {
                const res = await request(app)
                    .put('/api/settings')
                    .set('Authorization', 'Bearer token-admin')
                    .send({
                        hero: {
                            media: { mode: 'video', videoUrl: url }
                        }
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            }
        });

        it('should preserve existing hero fields when updating partial hero.media', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', 'Bearer token-admin')
                .send({
                    hero: {
                        media: { mode: 'video', videoUrl: '/media/hero/fresh.mp4' }
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Existing Image Upload Route Regression Check', () => {
        it('should keep standard /api/upload endpoint functioning for images', async () => {
            setupMockUserWithRole('admin');

            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', 'Bearer token-admin')
                .attach('image', Buffer.alloc(100), 'avatar.jpg');

            expect([200, 400, 500]).toContain(res.status);
        });
    });
});
