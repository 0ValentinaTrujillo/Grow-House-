// =============================================
// CONFIGURACIÓN DE BASE DE DATOS - MONGODB ATLAS
// =============================================

const mongoose = require('mongoose');

/**
 * Conectar a MongoDB Atlas
 * Esta función establece la conexión entre nuestra app y la base de datos
 */
const connectDB = async () => {
    try {
        console.log('🔄 Intentando conectar a MongoDB Atlas...');
        
        // Opciones de conexión optimizadas
        const options = {
            maxPoolSize: 10,            // Máximo 10 conexiones simultáneas
            serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
            socketTimeoutMS: 45000,     // Timeout de socket de 45 segundos
            family: 4                   // Usar IPv4
        };

        // Realizar la conexión
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        
        // Mostrar información de éxito
        console.log('✅ MongoDB Atlas conectado exitosamente');
        console.log(`📍 Host: ${conn.connection.host}`);
        console.log(`🗃️  Base de datos: ${conn.connection.name}`);
        console.log(`🔌 Puerto: ${conn.connection.port}`);
        
        return conn;
        
    } catch (error) {
        console.error('❌ Error conectando a MongoDB Atlas:');
        
        // Diferentes tipos de errores comunes
        if (error.code === 'ETIMEDOUT') {
            console.error('⏱️  Error: Conexión tardó demasiado (timeout)');
            console.error('💡 Solución: Verificar conexión a internet');
        } else if (error.code === 'ENOTFOUND') {
            console.error('🔍 Error: Host no encontrado');
            console.error('💡 Solución: Verificar URL de MongoDB Atlas');
        } else if (error.name === 'MongoParseError') {
            console.error('📝 Error: Formato incorrecto en URL de MongoDB');
            console.error('💡 Solución: Revisar MONGODB_URI en .env');
        } else if (error.name === 'MongoNetworkError') {
            console.error('🌐 Error: Problema de red');
            console.error('💡 Solución: Verificar acceso a internet y IP whitelist');
        } else {
            console.error(`🐛 Error desconocido: ${error.message}`);
        }
        
        // En desarrollo, mostrar error completo
        if (process.env.NODE_ENV === 'development') {
            console.error('📋 Stack trace completo:');
            console.error(error.stack);
        }
        
        // Cerrar aplicación si no puede conectar
        process.exit(1);
    }
};

/**
 * Cerrar conexión elegantemente
 */
const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada correctamente');
    } catch (error) {
        console.error('❌ Error cerrando conexión:', error.message);
    }
};

// =============================================
// EVENTOS DE CONEXIÓN PARA MONITOREO
// =============================================

mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado a MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión Mongoose:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado de MongoDB Atlas');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconectado a MongoDB Atlas');
});

// Cerrar conexión cuando la app termina
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando aplicación...');
    await closeDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    closeDB
};