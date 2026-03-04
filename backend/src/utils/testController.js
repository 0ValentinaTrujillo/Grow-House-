// =============================================
// TEST SIMPLE DEL CONTROLADOR
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function testController() {
    try {
        console.log('🧪 Testing controlador...\n');
        
        // Conectar
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Limpiar
        await Product.deleteMany({ name: /Test/ });
        console.log('✅ Datos de prueba limpiados');
        
        // Crear producto
        const product = new Product({
            name: 'Romero',
            description: 'Planta aromática de hoja perenne utilizada en la cocina y la medicina tradicional.',
            price: 5000,
            category: 'plantas',
            brand: '',
            mainImage: 'https://test.com/main.jpg',
            quantity: 12
        });
        
        await product.save();
        console.log('✅ Producto creado:', product.name);
        
        // Buscar producto
        const found = await Product.findById(product._id);
        console.log('✅ Producto encontrado:', found.name);
        
        // Actualizar producto
        await Product.findByIdAndUpdate(product._id, { price: 7000});
        console.log('✅ Producto actualizado');
        
        // Listar productos
        const products = await Product.find({ category: 'plantas' });
        console.log('✅ Productos listados:', products.length);
        
        // Eliminar producto
        await Product.findByIdAndDelete(product._id);
        console.log('✅ Producto eliminado');
        
        console.log('\n🎉 Controlador funcionando correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
    }
}

if (require.main === module) {
    testController();
}

module.exports = { testController };
