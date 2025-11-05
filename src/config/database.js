require('dotenv').config();
const { Sequelize } = require('sequelize');

// Opción 1: Usando variables individuales (RECOMENDADO)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },
    retry: {
      max: 3,
      timeout: 3000
    }
  }
);