const express = require('express');
const router = express.Router();

// Endpoint temporal para crear admin
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔧 Ejecutando script createAdmin...');
    
    // Ejecutar el script directamente
    const createAdmin = require('../../scripts/createAdmin');
    await createAdmin();
    
    res.json({ 
      success: true, 
      message: 'Usuario admin creado exitosamente' 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;