const router = require('express').Router();
const ctrl = require('../controllers/service.controller');

router.get('/', ctrl.getServices);
router.get('/:slug', ctrl.getService);

module.exports = router;
