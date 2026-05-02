// validators/evaluacionValidator.js
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
  tipo: Joi.string().default('parcial'),
  calificacion: Joi.number().min(0).max(10).optional().messages({
    'number.min': 'La calificación debe estar entre 0 y 10.',
    'number.max': 'La calificación debe estar entre 0 y 10.'
  }),
  comentarios: Joi.string().allow('', null).optional()
}).unknown(true);

const updateSchema = Joi.object({
  titulo: Joi.string().optional(),
  tipo: Joi.string().optional(),
  calificacion: Joi.number().min(0).max(10).optional().messages({
    'number.min': 'La calificación debe estar entre 0 y 10.',
    'number.max': 'La calificación debe estar entre 0 y 10.'
  }),
  comentarios: Joi.string().allow('', null).optional()
}).min(1).unknown(true).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});

module.exports = {
  createSchema,
  updateSchema
};
