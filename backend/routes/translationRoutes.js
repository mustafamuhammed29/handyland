const express = require('express');
const {
    getAllTranslations,
    getTranslationsByLocale,
    updateTranslation,
    createTranslation,
    deleteTranslation,
    saveMissingTranslation,
    autoTranslate
} = require('../controllers/translationController');

const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// ── Public: used by i18next-http-backend in the frontend ──────────────────────
router.get('/locales/:lang', cacheMiddleware(3600), getTranslationsByLocale);

// ── Public: auto-capture missing translation keys from the frontend ───────────
router.post('/missing/:lang/:namespace', saveMissingTranslation);

// ── Admin-only endpoints ──────────────────────────────────────────────────────
router.use(protect);
router.use(authorize('admin'));

router.post('/auto-translate', autoTranslate);

router.route('/')
    .get(getAllTranslations)
    .post(createTranslation);

router.route('/:id')
    .put(updateTranslation)
    .delete(deleteTranslation);

module.exports = router;
