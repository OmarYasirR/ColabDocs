const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, changePassword, checkAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/check-auth', checkAuth);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;