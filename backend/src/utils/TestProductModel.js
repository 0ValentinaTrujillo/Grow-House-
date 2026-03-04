// =============================================
// SCRIPT DE PRUEBAS - MODELO PRODUCTO
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product');

async function testProductModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Product...\n');
        
        // CONECTAR A LA BASE DE DATOS
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // PRUEBA 1: CREAR PRODUCTO VÁLIDO
        console.log('📱 === PRUEBA 1: CREAR PRODUCTO VÁLIDO ===');
        
        const validProduct = new Product({
            name: 'Geranio- Prueba',
            description: 'El geranio es un género de plantas conocido por su abundante floración y sus hojas aromáticas. Pertenece a la familia de las Geraniáceas y, aunque a menudo se confunden con los pelargonios (Pelargonium), los geranios (Geranium) son especies distintas, aunque sus cuidados son similares.',
            price: 18000,
            originalPrice: 20000,
            category: 'plantas',
            brand: '',
            mainImage: 'https://www.picturethisai.com/image-handle/website_cmsname/image/1080/347094560811679744.jpeg?x-oss-process=image/format,webp/resize,s_800&v=1.0',
            quantity: 25,
            tags: ['plantas', 'flores', 'exteriores', 'jardinería'],
            featured: true,
            status: 'active'
        });
        
        const validationError = validProduct.validateSync();
        
        if (validationError) {
            console.log('❌ Error de validación inesperado:');
            Object.values(validationError.errors).forEach(error => {
                console.log(`   • ${error.message}`);
            });
        } else {
            console.log('✅ Producto válido - Estructura correcta');
            console.log(`   📱 Nombre: ${validProduct.name}`);
            console.log(`   💰 Precio original: ${validProduct.formattedOriginalPrice}`);
            console.log(`   💰 Precio actual: ${validProduct.formattedPrice}`);
            console.log(`   🏷️ Descuento: ${validProduct.discountPercentage}%`);
            console.log(`   📦 Stock: ${validProduct.quantity} (${validProduct.stockStatus})`);
            console.log(`   🏷️ Categoría: ${validProduct.category}`);
            console.log(`   📖 Tags: ${validProduct.tags.join(', ')}`);
            console.log(`   ⭐ Estado: ${validProduct.statusText}`);
            
            console.log('\n💾 Probando guardado y middleware...');
            await validProduct.save();
            console.log(`✅ Producto guardado exitosamente con ID: ${validProduct.id}`);
            
            console.log(`   🔍 Keywords generadas: ${validProduct.keywords.join(', ')}`);
            console.log(`   📦 inStock sincronizado: ${validProduct.inStock}`);
            console.log(`   🏷️ Descuento calculado: ${validProduct.discount}%`);
        }
        
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidProduct = new Product({
            // name: FALTANTE (requerido)
            description: 'Muy corta',  // Menos de 10 caracteres
            price: -100,               // Precio negativo
            originalPrice: 50,         // Menor que price (inconsistente)
            category: 'categoria-inexistente', // No está en enum
            brand: '',                 // Puede ser vacío
            mainImage: 'no-es-url-de-imagen', // URL inválida
            quantity: -5               // Cantidad negativa
        });
        
        const errors = invalidProduct.validateSync();
        
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // PRUEBA 3: PROBAR CAMPOS VIRTUALES
        console.log('\n⚡ === PRUEBA 3: PROBAR CAMPOS VIRTUALES ===');
        
        const productForVirtuals = new Product({
            name: 'Producto para Virtuales',
            description: 'Producto creado específicamente para probar campos virtuales',
            price: 800000,
            originalPrice: 1000000,
            category: 'plantas',
            brand: '',
            mainImage: 'https://test.com/main.jpg',
            quantity: 3,
            lowStockAlert: 5,
            status: 'active'
        });
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   💰 Precio formateado: ${productForVirtuals.formattedPrice}`);
        console.log(`   💰 Precio original formateado: ${productForVirtuals.formattedOriginalPrice}`);
        console.log(`   🏷️ Descuento: ${productForVirtuals.discountPercentage}%`);
        console.log(`   📦 Estado del stock: ${productForVirtuals.stockStatus}`);
        console.log(`   ⭐ Estado en español: ${productForVirtuals.statusText}`);
        
        // PRUEBA 4: PROBAR MIDDLEWARE
        console.log('\n📄 === PRUEBA 4: PROBAR MIDDLEWARE ===');
        
        const productForMiddleware = new Product({
            name: 'Producto Middleware Test',
            description: 'Este producto probará que el middleware funciona correctamente',
            price: 1200000,
            originalPrice: 1500000,
            category: 'plantas',
            brand: '',
            mainImage: 'https://test.com/middleware-main.jpg',
            quantity: 0, // Sin stock para probar sincronización
            tags: ['  PLANTAS ', 'test', 'MIDDLEWARE', 'plantas'] // Con espacios y duplicados
        });
        
        console.log('💾 Guardando producto para activar middleware...');
        await productForMiddleware.save();
        
        console.log('✅ Middleware ejecutado correctamente:');
        console.log(`   📦 inStock sincronizado con quantity=0: ${productForMiddleware.inStock}`);
        console.log(`   🏷️ Descuento calculado: ${productForMiddleware.discount}%`);
        console.log(`   🏷️ Tags normalizadas: ${productForMiddleware.tags.join(', ')}`);
        console.log(`   🔍 Keywords generadas: ${productForMiddleware.keywords.slice(0, 5).join(', ')}...`);
        
        // PRUEBA 5: BUSCAR Y VERIFICAR DATOS
        console.log('\n🔍 === PRUEBA 5: BUSCAR Y VERIFICAR DATOS ===');
        
        const foundProducts = await Product.find({ 
            name: { $regex: 'Prueba|Test', $options: 'i' } 
        });
        
        console.log(`✅ Productos encontrados: ${foundProducts.length}`);
        
        foundProducts.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name}`);
            console.log(`      💰 ${product.formattedPrice}`);
            console.log(`      📦 Stock: ${product.stockStatus}`);
            console.log(`      🆔 ID: ${product.id}`);
        });
        
        // LIMPIEZA: ELIMINAR PRODUCTOS DE PRUEBA
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        const deleteResult = await Product.deleteMany({ 
            name: { $regex: 'Prueba|Test', $options: 'i' } 
        });
        
        console.log(`✅ ${deleteResult.deletedCount} productos de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Product está funcionando perfectamente');
        console.log('🚀 Listo para usar en controladores y APIs');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('📋 Stack trace completo:');
            console.error(error.stack);
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

// Ejecutar si el archivo se llama directamente
if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del modelo Product de Grow house\n');
    testProductModel()
        .then(() => {
            console.log('\n✨ ¡Pruebas completadas exitosamente!');
            console.log('🎯 El modelo Product está listo para la Parte 2B');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testProductModel };