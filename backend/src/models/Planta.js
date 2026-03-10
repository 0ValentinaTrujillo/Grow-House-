const mongoose = require('mongoose');

const PlantaSchema = new mongoose.Schema({
  usuario:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  nombre_comun:      { type: String, required: true },
  nombre_cientifico: { type: String },
  familia:           { type: String },
  nivel_dificultad:  { type: String, enum: ['Fácil', 'Intermedio', 'Difícil'] },
  descripcion:       { type: String },
  cuidados: {
    luz:           { type: String },
    riego:         { type: String },
    temperatura:   { type: String },
    humedad:       { type: String },
    fertilizacion: { type: String },
    poda:          { type: String }
  },
  recomendaciones: [{ type: String }],
  toxicidad:       { type: String },
  propagacion:     { type: String },
  tamano_esperado: { type: String },
  imagen:          { type: String },
  fecha:           { type: Date, default: Date.now }
});

module.exports = mongoose.model('Planta', PlantaSchema);