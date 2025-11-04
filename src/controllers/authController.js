const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Normalizar el email (quitar espacios y convertir a minúsculas)
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'El usuario o email ya están registrados'
      });
    }

    const user = await User.create({
      username,
      email: normalizedEmail,
      password,
      fullName,
      role: 'user'
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejo específico de errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({
        error: 'Error de validación',
        details: validationErrors.join(', ')
      });
    }
    
    // Error de unicidad (email o username duplicado)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El email o nombre de usuario ya está registrado'
      });
    }
    
    res.status(500).json({
      error: 'Error al registrar usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalizar el email
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login exitoso',
      user,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      details: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener perfil',
      details: error.message
    });
  }
};