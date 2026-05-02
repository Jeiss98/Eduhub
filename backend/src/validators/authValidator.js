// validators/authValidator.js
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido.',
    'any.required': 'Email es obligatorio.',
    'string.empty': 'Email no puede estar vacío.'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Contraseña es obligatoria.',
    'string.empty': 'Contraseña no puede estar vacía.'
  })
});

const registroSchema = Joi.object({
  nombre: Joi.string().trim().required().messages({
    'any.required': 'Nombre es obligatorio.',
    'string.empty': 'Nombre no puede estar vacío.'
  }),
  apellido: Joi.string().trim().allow('', null).optional(),
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido.',
    'any.required': 'Email es obligatorio.',
    'string.empty': 'Email no puede estar vacío.'
  }),
  documento: Joi.string().trim().min(4).max(30).required().messages({
    'string.empty': 'Documento no puede estar vacío.',
    'string.min': 'Documento debe tener al menos 4 caracteres.',
    'string.max': 'Documento no puede superar 30 caracteres.',
    'any.required': 'Documento es obligatorio.'
  }),
  rol: Joi.string().valid('estudiante', 'docente', 'admin').default('estudiante').messages({
    'any.only': 'Rol inválido. Usa: estudiante, docente o admin.'
  })
});

const cambiarPasswordSchema = Joi.object({
  password_actual: Joi.string().required().messages({
    'any.required': 'La contraseña actual es obligatoria.',
    'string.empty': 'La contraseña actual no puede estar vacía.'
  }),
  password_nueva: Joi.string().min(8).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 8 caracteres.',
    'any.required': 'La nueva contraseña es obligatoria.',
    'string.empty': 'La nueva contraseña no puede estar vacía.'
  })
});

module.exports = {
  loginSchema,
  registroSchema,
  cambiarPasswordSchema
};