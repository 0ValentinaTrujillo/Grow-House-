const express = require('express');
const router  = express.Router();

const { protect }      = require('../middleware/auth');
const adminController  = require('../controllers/adminController');

router.use(protect);

// ─── Productos ────────────────────────────────────────────────────────────────
router.get('/products',              adminController.getAllProducts);
router.post('/products',             adminController.createProduct);
router.get('/products/:id',          adminController.getProductById);
router.put('/products/:id',          adminController.updateProduct);
router.delete('/products/:id',       adminController.deleteProduct);
router.post('/products/:id/featured', adminController.toggleProductFeatured);

module.exports = router;