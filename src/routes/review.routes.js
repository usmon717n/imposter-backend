// review.routes.js
const { Router } = require('express');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth.middleware');

const reviewRouter = Router();

reviewRouter.post('/', authenticate, async (req, res, next) => {
  const { serviceId, rating, comment } = req.body;
  try {
    const review = await prisma.review.create({
      data: { userId: req.user.id, serviceId, rating: parseInt(rating), comment }
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

module.exports = reviewRouter;
