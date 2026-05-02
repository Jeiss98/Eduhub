// validators/tareaValidator.js
const Joi = require('joi');

const createSchema = Joi.object({
  id_proyecto: Joi.number().integer().required().messages({
    'any.required': 'id_proyecto es obligatorio.'
  }),
  id_estudiante: Joi.number().integer().required().messages({
    'any.required': 'id_estudiante es obligatorio.'
  }),
  titulo: Joi.string().required().messages({
    'any.required': 'titulo es obligatorio.'
  }),
  descripcion: Joi.string().allow('', null).optional(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').default('media').messages({
    'any.only': 'Prioridad inválida. Usa: baja, media, alta.'
  }),
  fecha_limite: Joi.date().iso().required().messages({
    'any.required': 'fecha_limite es obligatoria.'
  })
});

const updateSchema = Joi.object({
  titulo: Joi.string().optional(),
  descripcion: Joi.string().allow('', null).optional(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').optional(),
  fecha_limite: Joi.date().iso().optional(),
  completada: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});

module.exports = {
  createSchema,
  updateSchema
};
