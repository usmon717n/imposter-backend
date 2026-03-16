'use strict';

const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const path          = require('path');
const fs            = require('fs');
const { body, validationResult } = require('express-validator');
const prisma        = require('../config/prisma');

// ─── HELPERS ──────────────────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => ({
  id:           user.id,
  email:        user.email,
  phone:        user.phone   ?? null,
  role:         user.role,
  authProvider: user.authProvider,
  createdAt:    user.createdAt,
  profile: user.profile
    ? {
        firstName: user.profile.firstName,
        lastName:  user.profile.lastName,
        avatar:    user.profile.avatar ?? null,
        city:      user.profile.city   ?? null,
        lang:      user.profile.lang,
      }
    : null,
});

const findOrCreateGoogleUser = async ({ googleId, email, given_name, family_name, picture }) => {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    include: { profile: true },
  });

  if (user) {
    // Link Google ID if not yet linked
    if (!user.googleId || (picture && !user.profile?.avatar)) {
      user = await prisma.user.update({
        where:   { id: user.id },
        data: {
          googleId,
          authProvider: 'GOOGLE',
          profile: {
            update: {
              ...(!user.profile?.avatar && picture ? { avatar: picture } : {}),
            },
          },
        },
        include: { profile: true },
      });
    }
    return user;
  }

  // New Google user
  return prisma.user.create({
    data: {
      email,
      googleId,
      authProvider: 'GOOGLE',
      profile: {
        create: {
          firstName: given_name  || 'User',
          lastName:  family_name || '',
          avatar:    picture     || null,
          lang:      'UZ',
        },
      },
    },
    include: { profile: true },
  });
};

// ─── REGISTER ─────────────────────────────────────────────
exports.registerValidation = [
  body('email')     .isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')  .isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('firstName') .notEmpty().trim().withMessage('First name required'),
  body('lastName')  .notEmpty().trim().withMessage('Last name required'),
  body('phone')     .optional({ nullable: true }).trim(),
];

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password, firstName, lastName, phone, lang = 'UZ' } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data: {
        email,
        phone:        phone || null,
        password:     hashed,
        authProvider: 'LOCAL',
        profile:      { create: { firstName, lastName, lang } },
      },
      include: { profile: true },
    });

    const token = generateToken(user.id);
    return res.status(201).json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ─────────────────────────────────────────────────
exports.loginValidation = [
  body('email')   .isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where:   { email },
      include: { profile: true },
    });

    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user.id);
    return res.json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
};

// ─── GOOGLE (ID token) ────────────────────────────────────
exports.googleAuth = async (req, res, next) => {
  return res.status(400).json({ success: false, message: 'Use /google-token endpoint' });
};

// ─── GOOGLE TOKEN (access_token) ──────────────────────────
exports.googleToken = async (req, res, next) => {
  const { accessToken } = req.body;
  if (!accessToken)
    return res.status(400).json({ success: false, message: 'accessToken required' });

  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok)
      return res.status(401).json({ success: false, message: 'Invalid Google token' });

    const payload = await resp.json();
    if (!payload.email)
      return res.status(400).json({ success: false, message: 'No email from Google' });

    const user  = await findOrCreateGoogleUser({
      googleId:    payload.sub,
      email:       payload.email,
      given_name:  payload.given_name,
      family_name: payload.family_name,
      picture:     payload.picture,
    });

    const token = generateToken(user.id);
    return res.json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
};

// ─── GET ME ────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  // Re-fetch fresh data from DB
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user.id },
      include: { profile: true },
    });
    res.json({ success: true, data: safeUser(user) });
  } catch (err) {
    res.json({ success: true, data: safeUser(req.user) });
  }
};

// ─── UPDATE PROFILE ────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  const { firstName, lastName, phone, city, lang } = req.body;

  try {
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data:  { ...(phone !== undefined && { phone: phone || null }) },
      }),
      prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          ...(firstName !== undefined && firstName && { firstName }),
          ...(lastName  !== undefined && lastName  && { lastName  }),
          ...(city      !== undefined               && { city: city || null }),
          ...(lang      !== undefined && lang       && { lang }),
        },
      }),
    ]);

    return res.json({
      success: true,
      data: safeUser({ ...updatedUser, profile: updatedProfile }),
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPLOAD AVATAR ────────────────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file uploaded' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar file if exists
    const currentProfile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });
    if (currentProfile?.avatar && currentProfile.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../', currentProfile.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data:  { avatar: avatarUrl },
    });

    return res.json({ success: true, data: { avatar: avatarUrl } });
  } catch (err) {
    next(err);
  }
};
