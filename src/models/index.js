const { sequelize } = require('../config/database');
const UserModel = require('./User');
const IncidentModel = require('./Incident');

const User = UserModel(sequelize);
const Incident = IncidentModel(sequelize);

// Relaciones
User.hasMany(Incident, {
  foreignKey: 'userId',
  as: 'incidents'
});

Incident.belongsTo(User, {
  foreignKey: 'userId',
  as: 'reporter'
});

// Sincronizar modelos
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ Modelos sincronizados con la base de datos');
  } catch (error) {
    console.error('✗ Error sincronizando modelos:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Incident,
  syncDatabase
};