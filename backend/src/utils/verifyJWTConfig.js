require('dotenv').config();

console.log('Verificando configuración JWT...\n');

console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ Falta');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE ? '✅ Configurado' : '❌ Falta');
console.log('JWT_COOKIE_EXPIRE:', process.env.JWT_COOKIE_EXPIRE ? '✅ Configurado' : '❌ Falta');

console.log('\nDetalles:');
if (process.env.JWT_SECRET) {
    console.log('- JWT_SECRET longitud:', process.env.JWT_SECRET.length, 'caracteres');
    console.log('- JWT_EXPIRE:', process.env.JWT_EXPIRE);
}

// Verificar jsonwebtoken instalado
try {
    const jwt = require('jsonwebtoken');
    console.log('\n✅ Librería jsonwebtoken instalada');
    
    // Prueba rápida de generación
    const testToken = jwt.sign(
        { test: true }, 
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('✅ Generación de token funciona');
    
    // Prueba de verificación
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('✅ Verificación de token funciona');
    
    console.log('\n🎉 Configuración JWT correcta');
    
} catch (error) {
    console.log('\n❌ Error:', error.message);
}