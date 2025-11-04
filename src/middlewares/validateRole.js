// Middleware para validar roles de usuario

const validateRole = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        });
      }
  
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'No tienes permisos para acceder a este recurso',
          requiredRole: allowedRoles,
          currentRole: req.user.role
        });
      }
  
      next();
    };
  };
  
  // Middleware específico para admin
  const requireAdmin = validateRole('admin');
  
  // Middleware específico para usuario regular
  const requireUser = validateRole('user', 'admin');
  
  module.exports = {
    validateRole,
    requireAdmin,
    requireUser
  };