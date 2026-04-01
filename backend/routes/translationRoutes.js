const express = require('express');
const {
    getAllTranslations,
    getTranslationsByLocale,
    updateTranslation,
    createTranslation,
    deleteTranslation
} = require('../controllers/translationController');

const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Public endpoint used dynamically by i18next-http-backend
router.get('/locales/:lang', cacheMiddleware(86400), getTranslationsByLocale);

// Auto-capture missing keys from frontend
router.post('/missing/:lang/:namespace', require('../controllers/translationController').saveMissingTranslation);

// Admin restricted endpoints
router.use(protect);
router.use(authorize('admin'));

router.post('/auto-translate', require('../controllers/translationController').autoTranslate);

router.route('/')
    .get(getAllTranslations)
    .post(createTranslation);

router.route('/:id')
    .put(updateTranslation)
    .delete(deleteTranslation);

module.exports = router;
