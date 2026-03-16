const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticate, requireAdmin);

router.get('/dashboard', ctrl.getDashboard);
router.get('/orders', ctrl.getAllOrders);
router.put('/orders/:id/status', ctrl.updateOrderStatus);
router.get('/contacts', ctrl.getContacts);
router.put('/contacts/:id/status', ctrl.updateContactStatus);

module.exports = router;
