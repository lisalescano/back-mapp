require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuración de Sequelize para Supabase - CORREGIDA
const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // AGREGAR ESTO para forzar IPv4
      useIPv4: true,
      // Configuración adicional para problemas de conexión
      connectTimeout: 60000,
      keepAlive: true,
      keepAliveInitialDelay: 10000
    },
    // Configuración adicional de Sequelize
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5, // Reducido para plan gratuito
      min: 0,
      acquire: 60000, // Aumentado a 60 segundos
      idle: 10000,
      evict: 10000
    },
    retry: {
      max: 3,
      timeout: 30000
    },
    // Forzar IPv4 a nivel de sistema
    native: false, // Importante para evitar problemas de IPv6
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a Supabase exitosa');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:');
    console.error('🔍 Host:', process.env.DB_HOST);
    console.error('📝 Mensaje:', error.message);
    console.error('⚙️ Código:', error.parent?.code);
    
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize
};