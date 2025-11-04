const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  updateProfile
} = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
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

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, isAdmin, getAllUsers);

// Obtener usuario por ID (solo admin)
router.get('/:id', authenticateToken, isAdmin, getUserById);

// Actualizar rol de usuario (solo admin)
router.patch('/:id/role',
  authenticateToken,
  isAdmin,
  validate([
    body('role').isIn(['user', 'admin']).withMessage('Rol inválido')
  ]),
  updateUserRole
);

// Activar/desactivar usuario (solo admin)
router.patch('/:id/status',
  authenticateToken,
  isAdmin,
  validate([
    body('isActive').isBoolean().withMessage('isActive debe ser un boolean')
  ]),
  toggleUserStatus
);

// Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, isAdmin, deleteUser);

// Actualizar perfil propio (usuario autenticado)
router.patch('/profile/me',
  authenticateToken,
  validate([
    body('fullName').optional().trim(),
    body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido')
  ]),
  updateProfile
);

module.exports = router;