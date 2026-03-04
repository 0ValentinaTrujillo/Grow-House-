// =============================================
// TESTING COMPLETO DE APIS REST - GROW HOUSE
// =============================================

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const PRODUCTS_URL = `${API_BASE}/products`;

console.log('🧪 Iniciando testing completo de APIs Grow House\n');

// Configurar timeout para las pruebas
const api = axios.create({
    timeout: 10000,
    validateStatus: () => true // No lanzar error por códigos 4xx/5xx
});

// =============================================
// DATOS DE PRUEBA PARA GROW HOUSE
// =============================================

const testProducts = [
    {
        name: ' Aloe vera - Test API',
        description: 'El aloe vera es una planta suculenta conocida por sus propiedades hidratantes, antiinflamatorias y cicatrizantes. El gel transparente extraído de sus hojas se utiliza en cosmética, remedios caseros y suplementos alimenticios. ',
        price: 17000,
        originalPrice: 20000,
        category: 'plantas',
        brand: '',
        mainImage:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ57Srf20gcvPMb63g5jAyRou-Y2wJKTq67K_pHKt9xQxzWsyudYG8BvQmv9DMPl-msnXM&usqp=CAU',
        quantity: 15,
        tags: ['plantas', 'medicinales', 'exteriores', 'aloe vera']
    },
    {
        name: 'Romero - Test API',
        description: 'El romero es un arbusto perenne, originario de la región mediterránea, conocido por sus hojas aromáticas de color verde oscuro.',
        price: 18000,
        originalPrice: 20000,
        category: 'plantas',
        brand: '',
        mainImage: 'https://jardineros.com.co/wp-content/uploads/2022/04/Romero-aroma%CC%81tica1.jpg',
        quantity: 25,
        tags: ['plantas', 'aromaticas', 'cocina', 'medicinales', 'romero']
    }
];

// =============================================
// FUNCIONES DE TESTING
// =============================================

async function testServerHealth() {
    console.log('🏥 1. Testing estado del servidor...');
    
    try {
        const response = await api.get(`${API_BASE}/health`);
        
        if (response.status === 200) {
            console.log('   ✅ Servidor respondiendo correctamente');
            const status = response.data.status || 'OK';
            console.log(`   📊 Estado: ${status}`);
            console.log(`   🔍 Debug - Health response:`, Object.keys(response.data));
            console.log(`   🗄️ Base de datos: ${response.data.database.status}`);
            return true;
        } else {
            console.log('   ❌ Servidor no responde correctamente');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error conectando al servidor');
        console.log(`   💬 ${error.message}`);
        return false;
    }
}

async function testCreateProducts() {
    console.log('\n📱 2. Testing creación de productos...');
    
    const createdProducts = [];
    
    for (const product of testProducts) {
        try {
            const response = await api.post(PRODUCTS_URL, product);
            
           if (response.status === 201) {
            console.log(`   ✅ Creado: ${product.name}`);
            const productData = response.data.data;
            const productId = productData._id || productData.id || 'undefined';
            console.log(`   🆔 ID: ${productId}`);
            console.log(`   🔍 Debug - Objeto completo:`, Object.keys(productData));
            createdProducts.push(productData);
        } else {
            console.log(`   ❌ Error creando: ${product.name}`);
            console.log(`   💬 ${response.data.message || response.data.error}`);
            console.log(`   🔍 Debug - Respuesta:`, response.data);
        }
        } catch (error) {
            console.log(`   ❌ Error de red: ${error.message}`);
        }
    }
    
    return createdProducts;
}

async function testGetAllProducts() {
    console.log('\n📋 3. Testing obtener todos los productos...');
    
    try {
        const response = await api.get(PRODUCTS_URL);
        
        if (response.status === 200) {
            console.log(`   ✅ Lista obtenida: ${response.data.count} productos`);
            console.log(`   📊 Total en BD: ${response.data.total}`);
            console.log(`   📄 Página: ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}`);
            
            // Mostrar algunos productos
            if (response.data.data.length > 0) {
                console.log('\n   📱 Productos encontrados:');
                response.data.data.slice(0, 3).forEach(product => {
                    console.log(`      • ${product.name} - ${product.formattedPrice}`);
                });
            }
            
            return response.data.data;
        } else {
            console.log('   ❌ Error obteniendo productos');
            return [];
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return [];
    }
}

async function testGetProductById(products) {
    console.log('\n🔍 4. Testing obtener producto por ID...');
    
   if (products.length === 0) {
    console.log('   ⚠️ No hay productos para probar');
    return;
}

const firstProduct = products[0];
const productId = firstProduct._id || firstProduct.id;
console.log(`   🔍 Debug - Producto para probar:`, Object.keys(firstProduct));
console.log(`   🔍 Debug - ID extraído: ${productId}`);

if (!productId) {
    console.log('   ❌ No se pudo obtener ID del producto');
    return;
}
    
    try {
        const response = await api.get(`${PRODUCTS_URL}/${productId}`);
        
        if (response.status === 200) {
            console.log(`   ✅ Producto encontrado: ${response.data.data.name}`);
            console.log(`   💰 Precio: ${response.data.data.formattedPrice}`);
            console.log(`   📦 Stock: ${response.data.data.quantity} unidades`);
        } else {
            console.log('   ❌ Producto no encontrado');
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

async function testFilters() {
    console.log('\n🔧 5. Testing filtros y búsquedas...');
    
    const filters = [
        { name: 'Por categoría plantas', params: '?category=plantas' },
        { name: 'Por marca (opcional)', params: '?brand=' },
        { name: 'Por precio min', params: '?minPrice=1000' },
        { name: 'Búsqueda romero', params: '?search=romero' },
        { name: 'Ordenar por precio', params: '?sortBy=price_asc' },
        { name: 'Solo en stock', params: '?inStock=true' }
    ];
    
    for (const filter of filters) {
        try {
            const response = await api.get(`${PRODUCTS_URL}${filter.params}`);
            
            if (response.status === 200) {
                console.log(`   ✅ ${filter.name}: ${response.data.count} resultados`);
            } else {
                console.log(`   ❌ ${filter.name}: Error`);
            }
        } catch (error) {
            console.log(`   ❌ ${filter.name}: ${error.message}`);
        }
    }
}

async function testSpecialRoutes() {
    console.log('\n🎯 6. Testing rutas especiales...');
    
    const specialRoutes = [
        { name: 'Categoría plantas', url: `${PRODUCTS_URL}/category/plantas` },
        { name: 'Marca (opcional)', url: `${PRODUCTS_URL}/brand/` },
        { name: 'Búsqueda romero', url: `${PRODUCTS_URL}/search/romero` }
    ];
    
    for (const route of specialRoutes) {
        try {
            const response = await api.get(route.url);
            
            if (response.status === 200) {
                console.log(`   ✅ ${route.name}: ${response.data.count} productos`);
            } else {
                console.log(`   ❌ ${route.name}: Error`);
            }
        } catch (error) {
            console.log(`   ❌ ${route.name}: ${error.message}`);
        }
    }
}

async function testUpdateProduct(products) {
    console.log('\n✏️ 7. Testing actualización de producto...');
    
    if (products.length === 0) {
        console.log('   ⚠️ No hay productos para actualizar');
        return;
    }
    
    const productId = products[0]._id || products[0].id;
    console.log(`   🔍 Debug - ID para actualizar: ${productId}`);

    const updateData = {
        price: 19000,
        quantity: 20
    };
    
    try {
        const response = await api.put(`${PRODUCTS_URL}/${productId}`, updateData);
        
        if (response.status === 200) {
            console.log(`   ✅ Producto actualizado: ${response.data.data.name}`);
            console.log(`   💰 Nuevo precio: ${response.data.data.formattedPrice}`);
        } else {
            console.log('   ❌ Error actualizando producto');
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

async function testDeleteProducts(products) {
    console.log('\n🗑️ 8. Testing eliminación de productos de prueba...');
    
    for (const product of products) {
        try {
            const productId = product._id || product.id;
            console.log(`   🔍 Debug - Eliminando ID: ${productId}`);
            const response = await api.delete(`${PRODUCTS_URL}/${productId}`);
            
            if (response.status === 200) {
                console.log(`   ✅ Eliminado: ${response.data.deleted.name}`);
            } else {
                console.log(`   ❌ Error eliminando: ${product.name}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
}

// =============================================
// EJECUTAR TODAS LAS PRUEBAS
// =============================================

async function runAllTests() {
    console.log('🚀 INICIANDO TESTING COMPLETO DE APIS GROW HOUSE');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    // 1. Verificar servidor
    const serverOk = await testServerHealth();
    if (!serverOk) {
        console.log('\n❌ TESTING ABORTADO: Servidor no disponible');
        console.log('💡 Asegúrate de que el servidor esté corriendo: npm run dev');
        return;
    }
    
    let createdProducts = [];
    
    try {
        // 2. Crear productos de prueba
        createdProducts = await testCreateProducts();
        
        // 3. Obtener todos los productos
        const allProducts = await testGetAllProducts();
        
        // 4. Obtener producto específico
        await testGetProductById(allProducts);
        
        // 5. Probar filtros
        await testFilters();
        
        // 6. Probar rutas especiales
        await testSpecialRoutes();
        
        // 7. Probar actualización
        await testUpdateProduct(createdProducts);
        
    } finally {
        // 8. Limpiar productos de prueba
        if (createdProducts.length > 0) {
            await testDeleteProducts(createdProducts);
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`🎉 TESTING COMPLETADO EN ${duration} SEGUNDOS`);
    console.log('📊 Revisa los resultados arriba para verificar que todo funcione');
    console.log('🔗 APIs listas para integrar con el frontend');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('💥 Error fatal en testing:', error.message);
        process.exit(1);
    });
}

module.exports = { runAllTests };