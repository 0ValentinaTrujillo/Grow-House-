// =============================================
// APLICACIÓN PRINCIPAL - GROW HOUSE BACKEND
// =============================================

require('dotenv').config(); // Cargar variables de entorno PRIMERO

// ✅ Verificar API key sin exponerla
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Configurada' : '✗ No encontrada');


const express = require('express');
const adminRoutes = require('./routes/admin.routes');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter'); 
const mongoSanitize = require('express-mongo-sanitize'); 
const xss = require('xss-clean');  
const helmet = require('helmet');
const authRoutes = require("./routes/auth");
const mongoose = require("mongoose");

// ruta chatbot 
const chatbotRoutes = require('./routes/chatbot');


console.log('🚀 Iniciando Grow House Backend...');

// Crear aplicación Express
const app = express();

// =============================================
// HELMET - HEADERS DE SEGURIDAD
// =============================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'"] 
        }
    }
}));

console.log('🛡️  Helmet activado - Headers de seguridad configurados');

// =============================================
// LOGGING PERSONALIZADO
// =============================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    let requestType = '📡';
    if (url.includes('/products')) requestType = '📱';
    if (url.includes('/users')) requestType = '👤';
    if (url.includes('/orders')) requestType = '🛒';
    if (url.includes('/auth')) requestType = '🔐';
    if (url.includes('/chatbot')) requestType = '🤖'; 
    if (url.includes('/health')) requestType = '💚';
    if (url.includes('/recomendaciones')) requestType = '🌿';
    if (url.includes('/espacios')) requestType = '🏠';
    
    console.log(`${requestType} ${timestamp} - ${method} ${url} - IP: ${ip}`);
    next();
});

// Morgan
const morganMiddleware = require('./config/morganConfig');
app.use(morganMiddleware);

// =============================================
// RATE LIMITING
// =============================================
app.use('/api/', (req, res, next) => {
    if (
        req.path.includes("solicitar-codigo") ||
        req.path.includes("verificar-codigo") ||
        req.path.includes("cambiar-password")
    ) {
        return next();
    }
    generalLimiter(req, res, next);
});

// =============================================
// CORS
// =============================================
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://grow-house.vercel.app',
        'https://www.grow-house.com',
        process.env.FRONTEND_URL
    ].filter(Boolean)
    : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4200',
      'http://localhost:5500',
      'http://127.0.0.1:5500',      
      'http://127.0.0.1:5501'
    ];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (!allowedOrigins.includes(origin)) {
            return callback(new Error(`CORS: Origen ${origin} no permitido`), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// =============================================
// PARSEO
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// SANITIZACIÓN
// =============================================
app.use(mongoSanitize({ replaceWith: '_' }));

// ✅ xss() excluye rutas con imágenes base64
app.use((req, res, next) => {
    if (req.path.startsWith('/api/avatar') || req.path.startsWith('/api/registro')) {
        return next();
    }
    xss()(req, res, next);
});

// =============================================
// CONECTAR DB
// =============================================
connectDB();

// =============================================
// RUTA PRINCIPAL
// =============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏪 Grow House API + Chatbot IA activa',
        environment: process.env.NODE_ENV || 'development'
    });
});

// =============================================
// LOGIN O REGISTER CON GOOGLE
// =============================================
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);


// =============================================
// RUTAS API
// =============================================
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/avatar', require('./routes/avatar.routes'));

// 🔥RUTA DE ADMINISTRADOR
app.use('/api/admin', adminRoutes);

// IA
app.use('/api/chatbot', chatbotRoutes);

//recomendaciones
app.use('/api/recomendaciones', require('./routes/recomendaciones'));

// Registro
app.use('/api/registro', require('./routes/registro'));

//Espacios
app.use('/api/espacios', require('./routes/espacios'));

console.log('✅ Rutas activas:');
console.log('   📱 /api/products - Gestion de productos');
console.log('   🔐 /api/auth - Autenticacion y usuarios');
console.log('   📦 /api/orders - Gestión de pedidos');
console.log('   👑 /api/admin - Panel Administrador');
console.log('   🌿 /api/recomendaciones - Recomendaciones personalizadas');
console.log('   🌿 /api/registro - Registro de plantas ');
console.log('   🌿 /api/espacios - Decorar espacios')

// =============================================
// HEALTH
// =============================================
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');

    res.json({
        success: true,
        service: 'Grow House API',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        uptime: process.uptime()
    });
});

// =============================================
// ERRORES (SIEMPRE AL FINAL)
// =============================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
