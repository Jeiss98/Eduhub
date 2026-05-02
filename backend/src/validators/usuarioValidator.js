// validators/usuarioValidator.js
const Joi = require('joi');

const updateSchema = Joi.object({
  nombre: Joi.string().optional(),
  apellido: Joi.string().allow('', null).optional(),
  email: Joi.string().email().optional(),
  documento: Joi.string().trim().optional(),
  rol: Joi.string().valid('estudiante', 'docente', 'admin').optional(),
  activo: Joi.boolean().optional()
}).min(1).unknown(true).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});

const toggleStatusSchema = Joi.object({
  activo: Joi.boolean().required().messages({
    'any.required': 'Campo "activo" es obligatorio.'
  })
});

module.exports = {
  updateSchema,
  toggleStatusSchema
};
