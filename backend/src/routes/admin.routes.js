// =============================================
// RUTAS PANEL ADMINISTRADOR - GROW HOUSE
// =============================================

const express = require('express');
const router  = express.Router();

const { protect }     = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// =============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN DE ADMIN
// =============================================

router.use(protect);

// =============================================
// GESTIÓN DE PRODUCTOS
// =============================================

router.get('/products',              adminController.getAllProducts);
router.post('/products',             adminController.createProduct);
router.get('/products/:id',          adminController.getProductById);
router.patch('/products/:id/featured', adminController.toggleProductFeatured);
router.put('/products/:id',          adminController.updateProduct);
router.delete('/products/:id',       adminController.deleteProduct);

module.exports = router;