const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const router = express.Router();

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

// Registro
router.post('/register',
  validate([
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('fullName').optional().trim()
  ]),
  register
);

// Login
router.post('/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida')
  ]),
  login
);

// Perfil (requiere autenticación)
router.get('/profile', authenticateToken, getProfile);

module.exports = router;