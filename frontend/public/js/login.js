/* ═══════════════════════════════════════════════════════════
   login.js — Lógica del formulario de inicio de sesión
   EduHub · Konrad Lorenz 2026
   ═══════════════════════════════════════════════════════════ */

const API_BASE = window.EduHubConfig?.API_BASE || 'http://localhost:3000/api';

// ── Redirección por rol ──────────────────────────────────────
const REDIRECT = {
  admin:      'admin.html',
  docente:    'dashboard.html',
  estudiante: 'dashboard.html',
};

// ── Referencias al DOM ───────────────────────────────────────
const form        = document.getElementById('login-form');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const btnLogin    = document.getElementById('btn-login');
const btnText     = document.getElementById('btn-text');
const btnArrow    = document.getElementById('btn-arrow');
const passToggle  = document.getElementById('pass-toggle');
const eyeIcon     = document.getElementById('eye-icon');
const errorBox    = document.getElementById('login-error');

// ── Si ya hay sesión activa, redirigir ───────────────────────
(function checkSession() {
  const token   = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');
  if (token && usuario) {
    try {
      const u = JSON.parse(usuario);
      const dest = REDIRECT[u.rol] || 'dashboard.html';
      window.location.replace(dest);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }
})();

// ── Mostrar / ocultar contraseña ─────────────────────────────
if (passToggle) {
  passToggle.addEventListener('click', () => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';

    // Intercambia icono entre ojo abierto y ojo tachado
    eyeIcon.innerHTML = isPassword
      ? /* ojo tachado */
        `<path d="M13.359 11.238C13.77 10.566 14 9.806 14 9s-.23-1.566-.641-2.238M9.879 6.121A3 3 0 1012.879 9m-6-2.879A3 3 0 006.121 9M1.5 9s2.5-5.833 8.5-5.833S18.5 9 18.5 9s-2.5 5.833-8.5 5.833c-1.5 0-2.88-.322-4.063-.88M1.5 1.5l17 17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`
      : /* ojo abierto */
        `<path d="M1.667 10S4.167 4.167 10 4.167 18.333 10 18.333 10 15.833 15.833 10 15.833 1.667 10 1.667 10z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/>`;
  });
}

// ── Utilidades UI ────────────────────────────────────────────
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
  // Anima la caja de error con un micro-shake
  errorBox.animate([
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(3px)' },
    { transform: 'translateX(0)' },
  ], { duration: 300, easing: 'ease-out' });
}

function hideError() {
  errorBox.classList.remove('show');
  errorBox.textContent = '';
}

function setLoading(loading) {
  btnLogin.disabled = loading;
  if (loading) {
    btnText.textContent = 'Verificando...';
    if (btnArrow) btnArrow.style.display = 'none';
    // Agrega spinner
    if (!document.getElementById('btn-spinner')) {
      const spinner = document.createElement('span');
      spinner.id = 'btn-spinner';
      spinner.className = 'spinner';
      btnLogin.appendChild(spinner);
    }
  } else {
    btnText.textContent = 'Iniciar sesión';
    if (btnArrow) btnArrow.style.display = '';
    const spinner = document.getElementById('btn-spinner');
    if (spinner) spinner.remove();
  }
}

function validateInputs() {
  const email = emailInput.value.trim();
  const pass  = passInput.value;

  if (!email) {
    showError('Por favor ingresa tu correo institucional.');
    emailInput.focus();
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('El formato del correo no es válido.');
    emailInput.focus();
    return false;
  }

  if (!pass) {
    showError('Por favor ingresa tu contraseña.');
    passInput.focus();
    return false;
  }

  if (pass.length < 6) {
    showError('La contraseña debe tener al menos 6 caracteres.');
    passInput.focus();
    return false;
  }

  return true;
}

// ── Submit del formulario ────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  hideError();

  if (!validateInputs()) return;

  const email    = emailInput.value.trim();
  const password = passInput.value;

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || data.mensaje || 'Credenciales incorrectas.');
    }

    // Guardar sesión
    localStorage.setItem('token',   data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    // Animación de éxito en el botón
    btnText.textContent = '¡Acceso concedido!';
    btnLogin.style.background = 'linear-gradient(135deg, #10B981, #059669)';
    btnLogin.style.boxShadow  = '0 6px 24px rgba(16, 185, 129, 0.4)';

    // Redirección tras breve pausa
    const destino = REDIRECT[data.usuario.rol] || 'dashboard.html';
    setTimeout(() => {
      window.location.replace(destino);
    }, 700);

  } catch (err) {
    setLoading(false);
    showError(err.message || 'Error de conexión. Verifica que el servidor esté activo.');
  }
}

// ── Limpiar error al escribir ────────────────────────────────
[emailInput, passInput].forEach(input => {
  input?.addEventListener('input', hideError);
});

// ── Enter en el campo de email pasa al password ──────────────
emailInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    passInput.focus();
  }
});

// ── Registrar submit ─────────────────────────────────────────
if (form) {
  form.addEventListener('submit', handleLogin);
}

// ── Compatibilidad: click directo en el botón ────────────────
if (btnLogin && !form) {
  btnLogin.addEventListener('click', handleLogin);
}
