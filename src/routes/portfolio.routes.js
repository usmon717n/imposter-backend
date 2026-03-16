// portfolio.routes.js
const { Router } = require('express');
const prisma = require('../config/prisma');

const portfolioRouter = Router();

portfolioRouter.get('/', async (req, res, next) => {
  const { lang = 'UZ', category } = req.query;
  try {
    const items = await prisma.portfolio.findMany({
      where: { isPublished: true, ...(category && { category }) },
      include: { translations: { where: { lang } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: items.map(p => ({
        id: p.id,
        category: p.category,
        coverImage: p.coverImage,
        images: p.images,
        videoUrl: p.videoUrl,
        eventDate: p.eventDate,
        title: p.translations[0]?.title || '',
        description: p.translations[0]?.description || '',
        location: p.translations[0]?.location || '',
      }))
    });
  } catch (err) { next(err); }
});

module.exports = portfolioRouter;
