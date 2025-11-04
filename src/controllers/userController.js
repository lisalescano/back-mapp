const { User, Incident } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los usuarios (solo admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Incident,
        as: 'incidents',
        attributes: ['id']
      }]
    });

    // Agregar conteo de incidentes
    const usersWithCounts = users.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        incidentCount: userData.incidents?.length || 0,
        incidents: undefined // Remover el array completo
      };
    });

    res.json({
      users: usersWithCounts,
      total: usersWithCounts.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error al obtener usuarios',
      details: error.message
    });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Incident,
        as: 'incidents'
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error al obtener usuario',
      details: error.message
    });
  }
};

// Actualizar rol de usuario (solo admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir que el admin se quite a sí mismo el rol de admin
    if (user.id === req.user.id && role === 'user') {
      return res.status(400).json({ 
        error: 'No puedes quitarte el rol de administrador a ti mismo' 
      });
    }

    await user.update({ role });

    res.json({
      message: 'Rol actualizado exitosamente',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      error: 'Error al actualizar rol',
      details: error.message
    });
  }
};

// Activar/desactivar usuario (solo admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir que el admin se desactive a sí mismo
    if (user.id === req.user.id && !isActive) {
      return res.status(400).json({ 
        error: 'No puedes desactivar tu propia cuenta' 
      });
    }

    await user.update({ isActive });

    res.json({
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      error: 'Error al cambiar estado del usuario',
      details: error.message
    });
  }
};

// Eliminar usuario (solo admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir que el admin se elimine a sí mismo
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu propia cuenta' 
      });
    }

    // Eliminar usuario (esto también eliminará sus incidentes por CASCADE)
    await user.destroy();

    res.json({ 
      message: 'Usuario eliminado exitosamente',
      deletedUserId: id
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error al eliminar usuario',
      details: error.message
    });
  }
};

// Actualizar perfil de usuario (el propio usuario)
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email.trim().toLowerCase();

    await user.update(updateData);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      error: 'Error al actualizar perfil',
      details: error.message
    });
  }
};