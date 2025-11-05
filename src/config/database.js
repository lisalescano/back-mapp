require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Pool } = require('pg');

// Configuración manual del cliente PostgreSQL para forzar IPv4
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Forzar configuración de conexión
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 5,
});

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Configuración extrema para IPv4
    connection: {
      // Forzar IPv4
      family: 4,
    },
    stream: {
      // Configuración de socket
      lookup: (hostname, options, callback) => {
        // Forzar lookup IPv4
        require('dns').lookup(hostname, { family: 4 }, (err, address, family) => {
          if (err) return callback(err);
          callback(null, address, family);
        });
      }
    }
  },
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  retry: {
    max: 5,
    timeout: 30000,
    match: [/ENETUNREACH/, /ECONNREFUSED/, /ETIMEDOUT/]
  }
});

const testConnection = async () => {
  try {
    // Test directo con el pool
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time, version() as version');
      console.log('✅ Conexión directa exitosa:', result.rows[0].time);
    } finally {
      client.release();
    }
    
    // Test con Sequelize
    await sequelize.authenticate();
    console.log('✅ Conexión Sequelize exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    // Información de debug
    console.log('🔍 Debug info:');
    console.log('   - Host:', process.env.DB_HOST);
    console.log('   - Puerto:', process.env.DB_PORT);
    console.log('   - User:', process.env.DB_USER);
    console.log('   - Database:', process.env.DB_NAME);
    
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize,
  pool
};