const { Incident, User } = require('../models');
const { Op } = require('sequelize');

// Crear incidente (usuarios y admins)
exports.createIncident = async (req, res) => {
  try {
    const { category, description, latitude, longitude, address, imageUrl } = req.body;

    const incident = await Incident.create({
      category,
      description,
      latitude,
      longitude,
      address,
      imageUrl,
      userId: req.user.id,
      status: 'reportado'
    });

    const incidentWithUser = await Incident.findByPk(incident.id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'fullName']
      }]
    });

    res.status(201).json({
      message: 'Incidente reportado exitosamente',
      incident: incidentWithUser
    });
  } catch (error) {
    console.error('Error al crear incidente:', error);
    res.status(500).json({
      error: 'Error al crear incidente',
      details: error.message
    });
  }
};

// Obtener todos los incidentes con filtros
exports.getAllIncidents = async (req, res) => {
  try {
    const { status, category, priority, userId, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;

    const incidents = await Incident.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'fullName']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: incidents.count,
      incidents: incidents.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({
      error: 'Error al obtener incidentes',
      details: error.message
    });
  }
};

// Obtener incidente por ID
exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByPk(id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'fullName', 'email']
      }]
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    res.json({ incident });
  } catch (error) {
    console.error('Error al obtener incidente:', error);
    res.status(500).json({
      error: 'Error al obtener incidente',
      details: error.message
    });
  }
};

// Actualizar incidente (usuario puede editar sus propios reportes)
exports.updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, latitude, longitude, address, imageUrl } = req.body;

    const incident = await Incident.findByPk(id);

    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    // Solo el creador puede editar (a menos que sea admin)
    if (incident.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'No tienes permiso para editar este incidente'
      });
    }

    // Los usuarios no pueden cambiar el estado, solo la descripción y detalles
    const updateData = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;
    if (address !== undefined) updateData.address = address;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    await incident.update(updateData);

    const updatedIncident = await Incident.findByPk(id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'fullName']
      }]
    });

    res.json({
      message: 'Incidente actualizado exitosamente',
      incident: updatedIncident
    });
  } catch (error) {
    console.error('Error al actualizar incidente:', error);
    res.status(500).json({
      error: 'Error al actualizar incidente',
      details: error.message
    });
  }
};

// Actualizar estado del incidente (solo admin)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes } = req.body;

    const incident = await Incident.findByPk(id);

    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'solucionado') {
        updateData.resolvedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    await incident.update(updateData);

    const updatedIncident = await Incident.findByPk(id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'fullName', 'email']
      }]
    });

    res.json({
      message: 'Estado del incidente actualizado exitosamente',
      incident: updatedIncident
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      error: 'Error al actualizar estado del incidente',
      details: error.message
    });
  }
};

// Eliminar incidente (solo admin o el creador)
exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByPk(id);

    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    // Solo el creador o admin pueden eliminar
    if (incident.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'No tienes permiso para eliminar este incidente'
      });
    }

    await incident.destroy();

    res.json({ message: 'Incidente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar incidente:', error);
    res.status(500).json({
      error: 'Error al eliminar incidente',
      details: error.message
    });
  }
};

// Obtener mis incidentes (usuario actual)
exports.getMyIncidents = async (req, res) => {
  try {
    const { status, category } = req.query;

    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (category) where.category = category;

    const incidents = await Incident.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: incidents.length,
      incidents
    });
  } catch (error) {
    console.error('Error al obtener mis incidentes:', error);
    res.status(500).json({
      error: 'Error al obtener incidentes',
      details: error.message
    });
  }
};

// Obtener estadísticas (solo admin)
exports.getStatistics = async (req, res) => {
  try {
    const total = await Incident.count();
    const reportado = await Incident.count({ where: { status: 'reportado' } });
    const enReparacion = await Incident.count({ where: { status: 'en_reparacion' } });
    const solucionado = await Incident.count({ where: { status: 'solucionado' } });

    const byCategory = await Incident.findAll({
      attributes: [
        'category',
        [require('sequelize').fn('COUNT', 'id'), 'count']
      ],
      group: ['category']
    });

    res.json({
      total,
      byStatus: {
        reportado,
        en_reparacion: enReparacion,
        solucionado
      },
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
};