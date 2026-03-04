const User = require('../models/User');
const { sendVerificationCode } = require('../utils/sendEmail');
const logger = require('../config/logger');

// Almacén temporal EN MEMORIA (no en DB)
const pendingRegistrations = new Map();

const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, googleId, avatar } = req.body;

        console.log(`📝 Intento de registro: ${email}`);

        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos',
                details: 'firstName, lastName y email son obligatorios'
            });
        }

        if (!googleId && !password) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos',
                details: 'La contraseña es obligatoria para registro manual'
            });
        }

        // Verificar si ya existe en User
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email ya registrado',
                message: 'Ya existe una cuenta con este email'
            });
        }

        // Generar código de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

        // Guardar en memoria (NO en DB)
        pendingRegistrations.set(email.toLowerCase(), {
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            phone,
            googleId,
            avatar,
            verificationCode,
            expiresAt
        });

        // Enviar código por email
        try {
            const fullName = `${firstName} ${lastName}`;
            await sendVerificationCode(email, fullName, verificationCode);
            console.log(`✅ Código enviado a: ${email}`);
        } catch (emailError) {
            pendingRegistrations.delete(email.toLowerCase());
            console.error('❌ Error enviando código:', emailError);
            return res.status(500).json({
                success: false,
                error: 'Error enviando código de verificación',
                details: emailError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Código de verificación enviado',
            email: email.toLowerCase(),
            requiresVerification: true
        });

    } catch (error) {
        console.error(`❌ Error en register: ${error.message}`);
        next(error);
    }
};

// =============================================
// VERIFICAR CÓDIGO Y CREAR USUARIO
// =============================================

const verifyAndCreateUser = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email y código son requeridos'
            });
        }

        const pending = pendingRegistrations.get(email.toLowerCase());

        // Verificar que existe el registro pendiente
        if (!pending) {
            return res.status(400).json({
                success: false,
                error: 'No hay registro pendiente para este email'
            });
        }

        // Verificar que el código no expiró
        if (Date.now() > pending.expiresAt) {
            pendingRegistrations.delete(email.toLowerCase());
            return res.status(400).json({
                success: false,
                error: 'Código expirado',
                message: 'El código expiró. Intenta registrarte de nuevo.'
            });
        }

        // Verificar que el código es correcto
        if (pending.verificationCode !== code.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Código incorrecto',
                message: 'El código ingresado no es válido'
            });
        }

        // Código correcto → CREAR USUARIO EN DB
        const user = new User({
            firstName: pending.firstName,
            lastName: pending.lastName,
            email: pending.email,
            phone: pending.phone,
            role: 'customer',
            isEmailVerified: true,
            ...(pending.password && { password: pending.password }),
            ...(pending.googleId && { googleId: pending.googleId }),
        });

        await user.save();

        // Eliminar de memoria
        pendingRegistrations.delete(email.toLowerCase());

        console.log(`✅ Usuario creado: ${user.email}`);

        // Generar token JWT
        const token = user.generateAuthToken();
        const publicProfile = user.getPublicProfile();

        logger.audit('USER_REGISTERED', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        return res.status(201).json({
            success: true,
            message: '¡Cuenta creada exitosamente!',
            token,
            user: publicProfile
        });

    } catch (error) {
        console.error(`❌ Error verificando código: ${error.message}`);
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Credenciales incompletas',
                message: 'Email y contraseña son requeridos'
            });
        }

        const user = await User.findByCredentials(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta soporte.'
            });
        }

        if (user.isLocked) {
            return res.status(401).json({
                success: false,
                error: 'Cuenta bloqueada',
                message: 'Demasiados intentos fallidos. Intenta en 30 minutos.'
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            await user.incrementLoginAttempts();
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        logger.audit('USER_LOGIN', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        await user.resetLoginAttempts();

        const token = user.generateAuthToken();
        const publicProfile = user.getPublicProfile();

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: publicProfile
        });

    } catch (error) {
        console.error(`❌ Error en login: ${error.message}`);
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .populate('wishlist', 'name price mainImage')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error(`❌ Error en getProfile: ${error.message}`);
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.query.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID de usuario requerido'
            });
        }

        const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'avatar', 'address'];
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) updates[key] = req.body[key];
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }

        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error(`❌ Error en updateProfile: ${error.message}`);
        next(error);
    }
};

module.exports = {
    register,
    verifyAndCreateUser,
    login,
    getProfile,
    updateProfile
};