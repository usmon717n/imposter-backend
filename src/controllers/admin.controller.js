const prisma = require('../config/prisma');

// ─── DASHBOARD STATS ──────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      completedOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      contactRequests,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.order.aggregate({
        where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          service: { include: { translations: { where: { lang: 'UZ' } } } },
        },
      }),
      prisma.contactRequest.count({ where: { status: 'NEW' } }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          confirmedOrders,
          completedOrders,
          totalUsers,
          totalRevenue: totalRevenue._sum.totalPrice || 0,
          newContacts: contactRequests,
        },
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          eventDate: o.eventDate,
          totalPrice: o.totalPrice,
          createdAt: o.createdAt,
          client: `${o.user.profile?.firstName} ${o.user.profile?.lastName}`,
          clientPhone: o.user.phone,
          service: o.service.translations[0]?.name || '',
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL ORDERS (Admin) ───────────────────────────────
exports.getAllOrders = async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: status ? { status } : {},
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          service: { include: { translations: { where: { lang: 'UZ' } } } },
          package: { include: { translations: { where: { lang: 'UZ' } } } },
        },
      }),
      prisma.order.count({ where: status ? { status } : {} }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE ORDER STATUS ──────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── CONTACT REQUESTS ─────────────────────────────────────
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
};

exports.updateContactStatus = async (req, res, next) => {
  try {
    const contact = await prisma.contactRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};
