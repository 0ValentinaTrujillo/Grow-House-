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
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✓ MongoDB → ${conn.connection.name} @ Atlas`);

        return conn;

    } catch (error) {
        console.error('❌ Error conectando a MongoDB Atlas:', error.message);
        process.exit(1);
    }
};

/**
 * Cerrar conexión elegantemente
 */
const closeDB = async () => {
    try {
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error cerrando conexión MongoDB:', error.message);
    }
};

// =============================================
// EVENTOS DE CONEXIÓN PARA MONITOREO
// =============================================

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión Mongoose:', err.message);
});

// Cerrar conexión cuando la app termina
process.on('SIGINT', async () => {
    await closeDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    closeDB
};