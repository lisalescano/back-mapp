const express = require('express');
const { body, query } = require('express-validator');
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
  getMyIncidents,
  getStatistics
} = require('../controllers/incidentController');
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

// Crear incidente (requiere autenticación)
router.post('/',
  authenticateToken,
  validate([
    body('category').isIn(['calle_rota', 'luz_callejera', 'otro']).withMessage('Categoría inválida'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida'),
    body('address').optional().trim(),
    body('imageUrl').optional().isURL().withMessage('URL de imagen inválida')
  ]),
  createIncident
);

// Obtener todos los incidentes con filtros (público o autenticado)
router.get('/',
  validate([
    query('status').optional().isIn(['reportado', 'en_reparacion', 'solucionado']),
    query('category').optional().isIn(['calle_rota', 'luz_callejera', 'otro']),
    query('priority').optional().isIn(['baja', 'media', 'alta']),
    query('userId').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ]),
  getAllIncidents
);

// Obtener mis incidentes (requiere autenticación)
router.get('/my-incidents', authenticateToken, getMyIncidents);

// Obtener estadísticas (solo admin)
router.get('/statistics', authenticateToken, isAdmin, getStatistics);

// Obtener incidente por ID
router.get('/:id', getIncidentById);

// Actualizar incidente (requiere autenticación y ser el creador o admin)
router.put('/:id',
  authenticateToken,
  validate([
    body('category').optional().isIn(['calle_rota', 'luz_callejera', 'otro']),
    body('description').optional().trim().isLength({ min: 10, max: 1000 }),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('address').optional().trim(),
    body('imageUrl').optional().isURL()
  ]),
  updateIncident
);

// Actualizar estado del incidente (solo admin)
router.patch('/:id/status',
  authenticateToken,
  isAdmin,
  validate([
    body('status').optional().isIn(['reportado', 'en_reparacion', 'solucionado']),
    body('priority').optional().isIn(['baja', 'media', 'alta']),
    body('adminNotes').optional().trim()
  ]),
  updateIncidentStatus
);

// Eliminar incidente (requiere autenticación y ser el creador o admin)
router.delete('/:id', authenticateToken, deleteIncident);

module.exports = router;