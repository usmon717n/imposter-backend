// order.routes.js
const express = require('express');

const orderRouter = express.Router();
const orderCtrl = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');

orderRouter.use(authenticate);
orderRouter.post('/', orderCtrl.createOrderValidation, orderCtrl.createOrder);
orderRouter.get('/', orderCtrl.getMyOrders);
orderRouter.get('/:id', orderCtrl.getOrder);
orderRouter.put('/:id/cancel', orderCtrl.cancelOrder);

module.exports = orderRouter;
