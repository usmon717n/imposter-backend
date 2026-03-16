const prisma = require('../config/prisma');

// ─── GET ALL SERVICES ─────────────────────────────────────
exports.getServices = async (req, res, next) => {
  const { lang = 'UZ', category } = req.query;

  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      include: {
        translations: { where: { lang } },
        packages: {
          include: { translations: { where: { lang } } },
          orderBy: { price: 'asc' },
        },
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = services.map(s => ({
      id: s.id,
      slug: s.slug,
      category: s.category,
      basePrice: s.basePrice,
      images: s.images,
      name: s.translations[0]?.name || s.slug,
      description: s.translations[0]?.description || '',
      features: s.translations[0]?.features || [],
      packages: s.packages.map(p => ({
        id: p.id,
        slug: p.slug,
        price: p.price,
        isPopular: p.isPopular,
        name: p.translations[0]?.name || p.slug,
        includes: p.translations[0]?.includes || [],
      })),
      avgRating: s.reviews.length
        ? Math.round((s.reviews.reduce((a, r) => a + r.rating, 0) / s.reviews.length) * 10) / 10
        : null,
      reviewCount: s.reviews.length,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE SERVICE ───────────────────────────────────
exports.getService = async (req, res, next) => {
  const { slug } = req.params;
  const { lang = 'UZ' } = req.query;

  try {
    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        translations: { where: { lang } },
        packages: {
          include: { translations: { where: { lang } } },
          orderBy: { price: 'asc' },
        },
        reviews: {
          where: { isVisible: true },
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      data: {
        id: service.id,
        slug: service.slug,
        category: service.category,
        basePrice: service.basePrice,
        images: service.images,
        name: service.translations[0]?.name,
        description: service.translations[0]?.description,
        features: service.translations[0]?.features || [],
        packages: service.packages.map(p => ({
          id: p.id,
          slug: p.slug,
          price: p.price,
          isPopular: p.isPopular,
          name: p.translations[0]?.name,
          includes: p.translations[0]?.includes || [],
        })),
        reviews: service.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          user: {
            name: `${r.user.profile?.firstName} ${r.user.profile?.lastName}`,
            avatar: r.user.profile?.avatar,
          },
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};
