const { body, validationResult } = require('express-validator');
const prisma = require('../config/prisma');

exports.createOrderValidation = [
  body('serviceId').notEmpty(),
  body('eventDate').isISO8601(),
  body('eventType').notEmpty(),
  body('totalPrice').isInt({ min: 0 }),
];

// ─── CREATE ORDER ─────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { serviceId, packageId, eventDate, eventType, guestCount, venue, notes, totalPrice } = req.body;

  try {
    // Verify service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        serviceId,
        packageId: packageId || null,
        eventDate: new Date(eventDate),
        eventType,
        guestCount: guestCount ? parseInt(guestCount) : null,
        venue,
        notes,
        totalPrice,
        advancePayment: Math.round(totalPrice * 0.3), // 30% advance
      },
      include: {
        service: {
          include: { translations: { where: { lang: 'UZ' } } }
        },
        package: {
          include: { translations: { where: { lang: 'UZ' } } }
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        eventDate: order.eventDate,
        totalPrice: order.totalPrice,
        advancePayment: order.advancePayment,
        service: order.service.translations[0]?.name || '',
        package: order.package?.translations[0]?.name || null,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET USER ORDERS ──────────────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        service: { include: { translations: { where: { lang: 'UZ' } } } },
        package: { include: { translations: { where: { lang: 'UZ' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        eventDate: o.eventDate,
        eventType: o.eventType,
        totalPrice: o.totalPrice,
        createdAt: o.createdAt,
        service: o.service.translations[0]?.name || '',
        package: o.package?.translations[0]?.name || null,
      }))
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        service: { include: { translations: true } },
        package: { include: { translations: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── CANCEL ORDER ─────────────────────────────────────────
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
