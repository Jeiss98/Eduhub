// validators/proyectoValidator.js
const Joi = require('joi');

const estadoSchema = Joi.string().valid('activo', 'pausado', 'finalizado');

const createSchema = Joi.object({
  titulo: Joi.string().trim().required().messages({
    'any.required': 'Título es obligatorio.',
    'string.empty': 'Título no puede estar vacío.'
  }),
  descripcion: Joi.string().allow('', null).optional(),
  id_docente: Joi.number().integer().optional(),
  estado: estadoSchema.optional(),
  fecha_inicio: Joi.date().iso().required().messages({
    'any.required': 'fecha_inicio es obligatoria.',
    'date.format': 'fecha_inicio debe ser una fecha válida.'
  }),
  fecha_limite: Joi.date().iso().required().messages({
    'any.required': 'fecha_limite es obligatoria.',
    'date.format': 'fecha_limite debe ser una fecha válida.'
  })
}).unknown(true);

const updateSchema = Joi.object({
  titulo: Joi.string().trim().optional(),
  descripcion: Joi.string().allow('', null).optional(),
  id_docente: Joi.number().integer().optional(),
  estado: estadoSchema.optional(),
  fecha_inicio: Joi.date().iso().optional(),
  fecha_limite: Joi.date().iso().optional()
}).min(1).unknown(true).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});

const assignStudentSchema = Joi.object({
  usuario_id: Joi.number().integer().required().messages({
    'any.required': 'usuario_id es obligatorio.',
    'number.base': 'usuario_id debe ser numérico.'
  })
});

module.exports = {
  createSchema,
  updateSchema,
  assignStudentSchema
};