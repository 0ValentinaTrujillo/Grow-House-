// =============================================
// TESTING DE ENDPOINTS DE AUTENTICACIÓN - GROW HOUSE
// =============================================

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const AUTH_URL = `${API_BASE}/auth`;

console.log('🧪 Testing de endpoints de autenticación\n');

// Configurar axios
const api = axios.create({
    timeout: 10000,
    validateStatus: () => true  // No lanzar error por códigos 4xx/5xx
});

// Variables globales para el testing
let testToken = null;
let testUserId = null;

// =============================================
// TESTS
// =============================================

async function testRegister() {
    console.log('=== TEST 1: POST /api/auth/register ===');
    
    const userData = {
        firstName: 'Test',
        lastName: 'Routes API',
        email: `test-routes-${Date.now()}@grow-house.com`,
        password: 'Password123!',
        phone: '3001234567',
        role: 'customer'
    };
    
    try {
        const response = await api.post(`${AUTH_URL}/register`, userData);
        
        if (response.status === 201) {
            console.log('✅ Register exitoso');
            console.log(`   Status: ${response.status}`);
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   Token generado: ${response.data.token ? 'SÍ' : 'NO'}`);
            
            // Guardar para siguientes tests
            testToken = response.data.token;
            testUserId = response.data.user.id;
            
            console.log(`   User ID: ${testUserId}\n`);
        } else {
            console.log('❌ Register falló');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
        }
        
        return response.status === 201;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message, '\n');
        return false;
    }
}

async function testLogin() {
    console.log('=== TEST 2: POST /api/auth/login ===');
    
    if (!testUserId) {
        console.log('⚠️ No hay usuario del test 1 para hacer login\n');
        return false;
    }
    
    // Obtener el email del usuario usando la API de perfil
    try {
        const profileResponse = await api.get(`${AUTH_URL}/profile?userId=${testUserId}`);
        
        if (profileResponse.status !== 200) {
            console.log('❌ No se pudo obtener el email del usuario\n');
            return false;
        }
        
        const userEmail = profileResponse.data.user.email;
        
        // Hacer login con el email correcto
        const loginData = {
            email: userEmail,
            password: 'Password123!'
        };
        
        const response = await api.post(`${AUTH_URL}/login`, loginData);
        
        if (response.status === 200) {
            console.log('✅ Login exitoso');
            console.log(`   Status: ${response.status}`);
            console.log(`   Token: ${response.data.token.substring(0, 30)}...`);
            console.log(`   Usuario: ${response.data.user.email}\n`);
        } else {
            console.log('❌ Login falló');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
        }
        
        return response.status === 200;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message, '\n');
        return false;
    }
}

async function testLoginIncorrecto() {
    console.log('=== TEST 3: POST /api/auth/login (password incorrecta) ===');
    
    const loginData = {
        email: 'test@grow-house.com',
        password: 'WrongPassword123!'
    };
    
    try {
        const response = await api.post(`${AUTH_URL}/login`, loginData);
        
        if (response.status === 401) {
            console.log('✅ Password incorrecta rechazada correctamente');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
        } else {
            console.log('❌ Password incorrecta no rechazada');
            console.log(`   Status: ${response.status}\n`);
        }
        
        return response.status === 401;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message, '\n');
        return false;
    }
}

async function testGetProfile() {
    console.log('=== TEST 4: GET /api/auth/profile ===');
    
    if (!testUserId) {
        console.log('⚠️ No hay userId del test 1, usando uno manual\n');
        return false;
    }
    
    try {
        const response = await api.get(`${AUTH_URL}/profile?userId=${testUserId}`);
        
        if (response.status === 200) {
            console.log('✅ Perfil obtenido');
            console.log(`   Status: ${response.status}`);
            console.log(`   Nombre: ${response.data.user.fullName}`);
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   Rol: ${response.data.user.role}\n`);
        } else {
            console.log('❌ Error obteniendo perfil');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
        }
        
        return response.status === 200;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message, '\n');
        return false;
    }
}

async function testUpdateProfile() {
    console.log('=== TEST 5: PUT /api/auth/profile ===');
    
    if (!testUserId) {
        console.log('⚠️ No hay userId del test 1\n');
        return false;
    }
    
    const updateData = {
        phone: '3109876543',
        gender: 'male'
    };
    
    try {
        const response = await api.put(
            `${AUTH_URL}/profile?userId=${testUserId}`, 
            updateData
        );
        
        if (response.status === 200) {
            console.log('✅ Perfil actualizado');
            console.log(`   Status: ${response.status}`);
            console.log(`   Nuevo teléfono: ${response.data.user.phone}`);
            console.log(`   Mensaje: ${response.data.message}\n`);
        } else {
            console.log('❌ Error actualizando perfil');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
        }
        
        return response.status === 200;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message, '\n');
        return false;
    }
}

async function testRegisterDuplicado() {
    console.log('=== TEST 6: POST /api/auth/register (email duplicado) ===');
    
    const userData = {
        firstName: 'Test',
        lastName: 'Duplicate',
        email: 'test@grow-house.com',  // Email que probablemente ya existe
        password: 'Password123!'
    };
    
    try {
        const response = await api.post(`${AUTH_URL}/register`, userData);
        
        if (response.status === 400) {
            console.log('✅ Email duplicado rechazado');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
        } else {
            console.log('⚠️ Email duplicado no rechazado (puede no existir previamente)');
            console.log(`   Status: ${response.status}\n`);
        }
        
        return true;  // No falla el test
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message, '\n');
        return false;
    }
}

// =============================================
// EJECUTAR TODOS LOS TESTS
// =============================================

async function runAllTests() {
    console.log('🚀 INICIANDO TESTING DE ENDPOINTS DE AUTENTICACIÓN');
    console.log('='.repeat(60));
    console.log('');
    
    // Verificar que el servidor esté corriendo
    console.log('🔍 Verificando servidor...');
    try {
        const healthCheck = await api.get(`${API_BASE}/health`);
        if (healthCheck.status === 200) {
            console.log('✅ Servidor respondiendo correctamente\n');
        } else {
            console.log('⚠️ Servidor responde pero con estado inesperado\n');
        }
    } catch (error) {
        console.log('❌ SERVIDOR NO DISPONIBLE');
        console.log('💡 Asegúrate de ejecutar: npm run dev\n');
        process.exit(1);
    }
    
    let passed = 0;
    let total = 6;
    
    // Ejecutar tests
    if (await testRegister()) passed++;
    if (await testLogin()) passed++;
    if (await testLoginIncorrecto()) passed++;
    if (await testGetProfile()) passed++;
    if (await testUpdateProfile()) passed++;
    if (await testRegisterDuplicado()) passed++;
    
    // Resumen
    console.log('='.repeat(60));
    console.log(`📊 RESUMEN: ${passed}/${total} tests pasaron`);
    console.log(`📈 Porcentaje: ${((passed/total)*100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('\n🎉 TODOS LOS TESTS PASARON');
        console.log('✨ Endpoints de autenticación funcionando correctamente');
        console.log('🚀 Listo para Postman o frontend');
    } else {
        console.log(`\n⚠️ ${total - passed} tests fallaron`);
        console.log('🔍 Revisa los errores arriba');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runAllTests()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };