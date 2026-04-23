// =============================================
// MODELO ADMIN - GROW HOUSE
// =============================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({

    name: {
        type:     String,
        required: [true, 'El nombre es obligatorio'],
        trim:     true
    },

    email: {
        type:      String,
        required:  [true, 'El email es obligatorio'],
        unique:    true,
        lowercase: true,
        trim:      true,
        match:     [/^\S+@\S+\.\S+$/, 'Email no válido']
    },

    password: {
        type:      String,
        required:  [true, 'La contraseña es obligatoria'],
        select:    false
    }

}, { timestamps: true });

// Comparar contraseña
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema, 'users');