require('dotenv').config();
const { User } = require('../src/models');
const { testConnection } = require('../src/config/database');
const { syncDatabase } = require('../src/models');

const createAdmin = async () => {
  try {
    await testConnection();
    await syncDatabase();

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Crear admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@incidentes.com',
      password: 'admin123',
      fullName: 'Administrador del Sistema',
      role: 'admin'
    });

    console.log('\n✅ Usuario administrador creado exitosamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${admin.email}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: admin123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    process.exit(1);
  }
};

module.exports = {
  createAdmin
};