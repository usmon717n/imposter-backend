'use strict';

const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const ctrl    = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ─── AVATAR UPLOAD CONFIG ─────────────────────────────────
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const avatarUpload = multer({
  storage:    avatarStorage,
  limits:     { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP allowed'));
  },
});

// ─── ROUTES ───────────────────────────────────────────────
router.post('/register',      ctrl.registerValidation, ctrl.register);
router.post('/login',         ctrl.loginValidation,    ctrl.login);
router.post('/google-token',  ctrl.googleToken);
router.get ('/me',            authenticate,            ctrl.getMe);
router.put ('/profile',       authenticate,            ctrl.updateProfile);
router.post('/avatar',        authenticate, avatarUpload.single('avatar'), ctrl.uploadAvatar);

module.exports = router;
