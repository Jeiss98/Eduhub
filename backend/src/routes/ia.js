// routes/ia.js — Módulo IA con Google Gemini (EduHub Asistente)
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middlewares/auth');

/**
 * POST /api/ia/consulta
 * Permite al usuario hacer preguntas al asistente académico de EduHub.
 * Usa Google Gemini Flash si hay API key configurada;
 * si no, responde con sugerencias predefinidas basadas en palabras clave.
 */
router.post('/consulta', authMiddleware, async (req, res) => {
  const { pregunta } = req.body;

  if (!pregunta || typeof pregunta !== 'string' || pregunta.trim().length < 3) {
    return res.status(400).json({ ok: false, mensaje: 'La pregunta no puede estar vacía.' });
  }

  const preguntaClean = pregunta.trim();

  // ── Si hay API KEY de Gemini, usarla ─────────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      const respuestaGemini = await llamarGemini(preguntaClean, req.usuario);
      return res.json({ ok: true, respuesta: respuestaGemini, fuente: 'gemini' });
    } catch (err) {
      console.error('Gemini API error:', err.message);
      // Si falla Gemini, fallback a respuesta local
    }
  }

  // ── Respuesta local basada en palabras clave ──────────────────
  const respuesta = respuestaLocal(preguntaClean, req.usuario);
  return res.json({ ok: true, respuesta, fuente: 'local' });
});

/**
 * GET /api/ia/tips — Consejos académicos aleatorios
 */
router.get('/tips', authMiddleware, (req, res) => {
  const tips = [
    '📚 Dedica al menos 2 horas diarias al repaso de temas recientes.',
    '🎯 Usa la técnica Pomodoro: 25 min de estudio, 5 min de descanso.',
    '🤝 Los proyectos en equipo mejoran habilidades de comunicación técnica.',
    '📝 Documenta tu código desde el principio; tu yo del futuro te lo agradecerá.',
    '🔍 Practica la lectura crítica de artículos científicos para fortalecer el análisis.',
    '💡 Convierte los errores en aprendizaje: cada bug resuelto es experiencia acumulada.',
    '🗂️ Mantén un repositorio de código organizado; usa Git desde el primer día.',
    '⏰ Gestiona tu tiempo con un tablero Kanban para visualizar tareas pendientes.',
    '🧠 Explica conceptos difíciles a otros: enseñar es la mejor forma de aprender.',
    '🌐 Contribuye a proyectos de código abierto para ganar experiencia real.',
  ];
  const tip = tips[Math.floor(Math.random() * tips.length)];
  res.json({ ok: true, tip });
});

// ─── Función de llamada a Google Gemini ───────────────────────

async function llamarGemini(pregunta, usuario) {
  const contexto = `
Eres EduBot, el asistente académico inteligente de EduHub, la plataforma de gestión académica de la Fundación Universitaria Konrad Lorenz.
El usuario que consulta es: ${usuario.nombre} (rol: ${usuario.rol}).
Responde de forma clara, concisa y en español. Si la pregunta no es académica, redirígela amablemente hacia temas educativos.
Nunca inventes datos de calificaciones, proyectos o usuarios específicos del sistema.
  `.trim();

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${contexto}\n\nPregunta: ${pregunta}` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  const apiKey  = process.env.GEMINI_API_KEY;
  const model   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url     = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${err}`);
  }

  const json = await resp.json();
  const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return texto || 'No pude generar una respuesta en este momento.';
}

// ─── Respuesta local basada en palabras clave ─────────────────

function respuestaLocal(pregunta, usuario) {
  const p = pregunta.toLowerCase();

  if (p.includes('tarea') || p.includes('pendiente')) {
    return `Hola ${usuario.nombre} 👋 Para revisar tus tareas pendientes, dirígete a la sección **Tareas** en tu dashboard. Allí puedes ver fecha límite y prioridad de cada una.`;
  }
  if (p.includes('proyecto')) {
    return `Los proyectos se gestionan en la sección **Proyectos**. Puedes ver el avance, los estudiantes asignados y las evaluaciones de cada proyecto.`;
  }
  if (p.includes('nota') || p.includes('calificacion') || p.includes('calificación') || p.includes('promedio')) {
    return `Tus calificaciones y promedio están disponibles en la sección **Evaluaciones** de tu dashboard. El promedio se calcula automáticamente sobre todas tus notas registradas.`;
  }
  if (p.includes('contraseña') || p.includes('password') || p.includes('clave')) {
    return `Para cambiar tu contraseña, ve a tu perfil y selecciona "Cambiar contraseña". Necesitarás ingresar tu contraseña actual y la nueva (mínimo 8 caracteres).`;
  }
  if (p.includes('hola') || p.includes('saludo') || p.includes('buenas')) {
    return `¡Hola ${usuario.nombre}! 🎓 Soy **EduBot**, tu asistente académico en EduHub. ¿En qué puedo ayudarte hoy? Puedo orientarte sobre proyectos, tareas, evaluaciones o el uso de la plataforma.`;
  }
  if (p.includes('reporte') || p.includes('pdf')) {
    return `Los reportes en PDF están disponibles en la sección **Reportes** para docentes y administradores. Puedes generar reportes de estudiantes, proyectos y tareas vencidas.`;
  }
  if (p.includes('auditoria') || p.includes('auditoría')) {
    return `La auditoría de la plataforma registra automáticamente cada inserción, actualización o eliminación de datos. Administradores y docentes pueden consultarla desde el panel de administración.`;
  }

  return `Hola ${usuario.nombre} 👋 Soy **EduBot**, el asistente de EduHub. Puedo ayudarte con información sobre tus proyectos, tareas, evaluaciones y el uso de la plataforma. ¿Qué necesitas saber?`;
}

module.exports = router;
