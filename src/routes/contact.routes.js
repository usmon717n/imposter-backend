// contact.routes.js
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/prisma');

const contactRouter = Router();

contactRouter.post('/', [
  body('name').notEmpty().trim(),
  body('phone').notEmpty(),
  body('message').notEmpty().trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const contact = await prisma.contactRequest.create({ data: req.body });
    res.status(201).json({ success: true, message: 'Message sent successfully', data: contact });
  } catch (err) { next(err); }
});

module.exports = contactRouter;
