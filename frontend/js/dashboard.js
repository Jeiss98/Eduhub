/* ═══════════════════════════════════════════════════════════
   dashboard.js — EduHub v4.1
   Lógica principal del panel de usuario (estudiante / docente / admin)
   Base URL: http://localhost:3000
═══════════════════════════════════════════════════════════ */

const API = window.EduHubConfig?.API_BASE || 'http://localhost:3000/api';

/* ─── Estado global ─── */
const state = {
    user: null,          // datos del usuario logueado (del JWT)
    proyectos: [],
    tareas: [],
    notas: [],
    noticias: [],
    usuarios: [],
};

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) return redirect('login.html');

    // Decodificar JWT sin librería
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        state.user = payload;
    } catch {
        return redirect('login.html');
    }

    setupSidebar();
    setupTheme();
    setupNav();
    setupTopbar();
    checkAPI();
    loadUserInfo();
    loadDashboardData();         // Carga inicial del home
    setupModalListeners();
    setupAIAssistant();
    setupReportes();

    // Delegación de carga lazy por sección
    document.querySelectorAll('.nav-item[data-sec]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sec = btn.dataset.sec;
            if (sec === 'proyectos') loadProyectos();
            if (sec === 'tareas') loadTareas();
            if (sec === 'notas') loadNotas();
            if (sec === 'noticias') loadNoticias();
            if (sec === 'usuarios') loadUsuarios();
            if (sec === 'perfil') loadPerfil();
        });
    });
});

/* ══════════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════════ */
function redirect(path) { window.location.href = path; }

function token() { return localStorage.getItem('token') || ''; }

async function apiFetch(endpoint, opts = {}) {
    const res = await fetch(`${API}${endpoint}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token()}`,
            ...(opts.headers || {}),
        },
    });
    if (res.status === 401) { localStorage.clear(); redirect('login.html'); }
    return res;
}

function toast(msg, type = 'ok') {
    const el = document.getElementById('toast');
    const dot = document.getElementById('td');
    const text = document.getElementById('tm');
    if (!el) return;
    text.textContent = msg;
    dot.style.background = type === 'ok' ? 'var(--brand-green)' : 'var(--danger)';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

function isAdmin() { 
    const rol = state.user?.rol;
    return rol === 'admin'; 
}
function isDocente() { 
    const rol = state.user?.rol;
    return rol === 'docente'; 
}
function isAdminOrDocente() { return isAdmin() || isDocente(); }

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `hace ${mins} min`;
    if (hours < 24) return `hace ${hours} h`;
    return `hace ${days} d`;
}

function pill(estado) {
    const map = {
        activo: 'badge-green',
        completado: 'badge-info',
        pausado: 'badge-amber',
        cancelado: 'badge-rose',
        pendiente: 'badge-amber',
        completada: 'badge-green',
    };
    return `<span class="badge ${map[estado] || 'badge-amber'}">${estado}</span>`;
}

/* ══════════════════════════════════════════════════
   SIDEBAR & TEMA
══════════════════════════════════════════════════ */
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sb-overlay');
    const openBtn = document.getElementById('sb-open-btn');
    const closeBtn = document.getElementById('sb-close-btn');

    openBtn?.addEventListener('click', () => { sidebar.classList.add('open'); overlay?.classList.add('show'); });
    closeBtn?.addEventListener('click', () => { sidebar.classList.remove('open'); overlay?.classList.remove('show'); });
    overlay?.addEventListener('click', () => { sidebar.classList.remove('open'); overlay?.classList.remove('show'); });
}

function setupTheme() {
    // Delegado a theme.js — ya aplica el tema, enlaza el botón y actualiza el label.
    // Esta función permanece para mantener compatibilidad con la llamada en el init.
}

/* ══════════════════════════════════════════════════
   NAVEGACIÓN POR SECCIONES
══════════════════════════════════════════════════ */
function setupNav() {
    const navItems = document.querySelectorAll('.nav-item[data-sec]');
    const sections = document.querySelectorAll('.sec');
    const tbTitle = document.getElementById('tb-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            const sec = document.getElementById(`sec-${item.dataset.sec}`);
            if (sec) sec.classList.add('active', 'fade-up');

            const label = item.querySelector('span:not(.ni-badge)');
            if (tbTitle && label) tbTitle.textContent = label.textContent.trim();

            // Cerrar sidebar móvil
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sb-overlay')?.classList.remove('show');
        });
    });

    // "Ver todo" tareas desde dashboard
    document.getElementById('btn-ver-tareas')?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-sec="tareas"]')?.click();
    });

    // Tile clicables
    document.getElementById('tile-proyectos')?.addEventListener('click', () =>
        document.querySelector('.nav-item[data-sec="proyectos"]')?.click());
    document.getElementById('tile-tareas')?.addEventListener('click', () =>
        document.querySelector('.nav-item[data-sec="tareas"]')?.click());
    document.getElementById('tile-promedio')?.addEventListener('click', () =>
        document.querySelector('.nav-item[data-sec="notas"]')?.click());

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.clear();
        redirect('login.html');
    });
}

/* ══════════════════════════════════════════════════
   TOPBAR — INDICADOR API
══════════════════════════════════════════════════ */
function setupTopbar() {
    // Nada extra por ahora — checkAPI() gestiona el LED
}

async function checkAPI() {
    const led = document.getElementById('api-led');
    const txt = document.getElementById('api-txt');
    try {
        const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
            if (led) { led.classList.add('led-on'); }
            if (txt) txt.textContent = 'API conectada';
        } else throw new Error();
    } catch {
        if (led) led.style.background = 'var(--danger)';
        if (txt) txt.textContent = 'API sin conexión';
    }
}

/* ══════════════════════════════════════════════════
   INFO DE USUARIO EN SIDEBAR
══════════════════════════════════════════════════ */
async function loadUserInfo() {
    const u = state.user;
    if (!u) return;

    // Nombre y email
    const name = `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email || 'Usuario';
    const nameEl = document.getElementById('sb-uname');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('sb-email') && (document.getElementById('sb-email').textContent = u.email || '—');

    updateUIRoleBased();

    // Avatar
    try {
        const res = await apiFetch(`/usuarios/${u.id_usuario || u.id}`);
        if (res.ok) {
            const data = await res.json();
            const perfData = data.usuario || data;
            if (perfData.avatar_url) {
                ['sb-avatar-img', 'prof-av-img'].forEach(id => {
                    const img = document.getElementById(id);
                    if (img) img.src = perfData.avatar_url;
                });
            }
        }
    } catch { /* silencioso */ }
}

function updateUIRoleBased() {
    const u = state.user;
    const currentRol = u.rol;

    // Actualizar pill de rol
    const rolePill = document.getElementById('sb-role-pill');
    if (rolePill) {
        const roles = { admin: 'Administrador', docente: 'Docente', estudiante: 'Estudiante' };
        // Buscar el nodo de texto después del SVG
        const textNode = Array.from(rolePill.childNodes).find(n => n.nodeType === 3);
        if (textNode) textNode.textContent = ` ${roles[currentRol] || currentRol}`;
        rolePill.style.boxShadow = 'none';
    }

    // Ocultar todo lo específico primero
    document.querySelectorAll('.nav-admin-only').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-docente-admin').forEach(el => el.classList.add('hidden'));

    if (u.rol === 'admin') {
        document.getElementById('grp-admin')?.classList.remove('hidden');
    }

    // Lógica de visibilidad basada en el rol real del usuario
    if (currentRol === 'admin') {
        document.querySelectorAll('.nav-admin-only').forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('.nav-docente-admin').forEach(el => el.classList.remove('hidden'));
    } else if (currentRol === 'docente') {
        document.querySelectorAll('.nav-docente-admin').forEach(el => el.classList.remove('hidden'));
    }

    // Títulos dinámicos en Dashboard
    const statLabel = document.querySelector('#tile-proyectos .stt-label');
    if (statLabel) statLabel.textContent = currentRol === 'estudiante' ? 'Mis proyectos' : 'Proyectos gestionados';
}

/* ══════════════════════════════════════════════════
   DASHBOARD — SECCIÓN INICIO
══════════════════════════════════════════════════ */
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadActivity(),
    ]);
    buildCalendar();
    buildCharts();
}

async function loadStats() {
    try {
        // Proyectos
        const rProy = await apiFetch('/proyectos');
        if (rProy.ok) {
            const data = await rProy.json();
            const proyectos = data.data || data.proyectos || (Array.isArray(data) ? data : []);
            state.proyectos = proyectos;
            const activos = proyectos.filter(p => p.estado === 'activo').length;
            document.getElementById('stat-proyectos') && (document.getElementById('stat-proyectos').textContent = activos);
            document.getElementById('badge-proyectos') && (document.getElementById('badge-proyectos').textContent = proyectos.length);
            document.getElementById('stat-proyectos-delta') && (document.getElementById('stat-proyectos-delta').textContent = `${proyectos.length} total`);
        }

        // Tareas
        const rTar = await apiFetch('/tareas');
        if (rTar.ok) {
            const data = await rTar.json();
            const tareas = data.data || data.tareas || (Array.isArray(data) ? data : []);
            state.tareas = tareas;
            const pendientes = tareas.filter(t => t.estado === 'pendiente' || !t.completada).length;
            const completadas = tareas.filter(t => t.estado === 'completada' || t.completada).length;
            document.getElementById('stat-tareas-pendientes') && (document.getElementById('stat-tareas-pendientes').textContent = pendientes);
            document.getElementById('stat-tareas-hechas') && (document.getElementById('stat-tareas-hechas').textContent = completadas);
            document.getElementById('badge-tareas') && (document.getElementById('badge-tareas').textContent = pendientes || '');
            document.getElementById('stat-tareas-delta') && (document.getElementById('stat-tareas-delta').textContent = pendientes === 0 ? '✅ Todo al día' : `${pendientes} por completar`);
            document.getElementById('stat-completadas-delta') && (document.getElementById('stat-completadas-delta').textContent = `de ${tareas.length} asignadas`);
        }

        // Notas → promedio
        const rNotas = await apiFetch('/evaluaciones');
        if (rNotas.ok) {
            const data = await rNotas.json();
            const notas = data.data || data.notas || (Array.isArray(data) ? data : []);
            state.notas = notas;
            const calificadas = notas.filter(n => n.tipo !== 'falla' && n.calificacion != null);
            const prom = calificadas.length
                ? (calificadas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / calificadas.length).toFixed(1)
                : '—';
            document.getElementById('stat-promedio') && (document.getElementById('stat-promedio').textContent = prom);
            document.getElementById('stat-promedio-delta') && (document.getElementById('stat-promedio-delta').textContent = `Sobre ${calificadas.length} evaluaciones`);
        }
    } catch (e) {
        console.error('[Stats]', e);
    }
}

async function loadActivity() {
    const list = document.getElementById('activity-list');
    if (!list) return;

    // Construimos actividad a partir de tareas recientes
    const tareas = state.tareas.slice(-6).reverse();
    if (!tareas.length) {
        list.innerHTML = '<div class="act-empty">Sin actividad reciente</div>';
        return;
    }

    list.innerHTML = tareas.map(t => {
        const done = t.estado === 'completada';
        const cls = done ? 'act-ico-g' : (t.prioridad === 'alta' ? 'act-ico-y' : 'act-ico-b');
        const icon = done
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`
            : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>`;
        return `
      <div class="act-item">
        <div class="act-ico ${cls}">${icon}</div>
        <div>
          <div class="act-title">${t.titulo || 'Tarea'}</div>
          <div class="act-time">${done ? 'Completada' : 'Pendiente'} · ${formatDate(t.fecha_limite || t.created_at)}</div>
        </div>
      </div>`;
    }).join('');
}

/* ── CALENDARIO ── */
function buildCalendar() {
    const grid = document.getElementById('cal-grid');
    const evLst = document.getElementById('cal-events');
    const title = document.getElementById('cal-mes-titulo');
    if (!grid) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (title) title.textContent = `${meses[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Recolectar fechas de eventos (tareas con vencimiento este mes)
    const events = {};
    state.tareas.forEach(t => {
        if (!t.fecha_limite) return;
        const d = new Date(t.fecha_limite);
        if (d.getFullYear() === year && d.getMonth() === month) {
            events[d.getDate()] = t.titulo;
        }
    });

    const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    let html = days.map(d => `<div class="cal-dow">${d}</div>`).join('');

    // Celdas vacías antes del día 1
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === now.getDate();
        const hasEv = events[d];
        const cls = isToday ? 'cal-today' : (hasEv ? 'cal-event' : '');
        html += `<div class="cal-day ${cls}" title="${hasEv || ''}">${d}</div>`;
    }

    grid.innerHTML = html;

    // Lista de eventos
    if (evLst) {
        const evEntries = Object.entries(events);
        evLst.innerHTML = evEntries.length
            ? evEntries.slice(0, 4).map(([day, name]) =>
                `<div class="cal-ev-item">
            <div class="cev-dot" style="background:var(--warning)"></div>
            <span>${meses[month]} ${day} — ${name}</span>
          </div>`).join('')
            : '<div style="font-size:.72rem;color:var(--muted2);text-align:center;padding:.5rem 0">Sin eventos este mes</div>';
    }
}

/* ── CHARTS (Chart.js) ── */
function buildCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const lbl = isDark ? '#888' : '#999';
    const green = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim() || '#22c55e';
    const amber = '#f59e0b';
    const info = '#38bdf8';
    const purple = '#7A2E8A';

    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = lbl;

    // — Bar chart (avance proyectos) —
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [
                    {
                        label: '2025',
                        data: [2, 4, 3, 5, 4, 6],
                        backgroundColor: green + '55',
                        borderColor: green,
                        borderWidth: 1.5,
                        borderRadius: 5,
                    },
                    {
                        label: '2026',
                        data: [3, 3, 5, 4, 7, 5],
                        backgroundColor: amber + '55',
                        borderColor: amber,
                        borderWidth: 1.5,
                        borderRadius: 5,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: grid }, ticks: { font: { size: 11 } } },
                    y: { grid: { color: grid }, ticks: { font: { size: 11 }, stepSize: 2 }, beginAtZero: true },
                },
            },
        });
    }

    // — Donut (estado general) —
    const donutCtx = document.getElementById('donutChart');
    if (donutCtx) {
        const total = state.tareas.length || 10;
        const hechas = state.tareas.filter(t => t.estado === 'completada').length || 7;
        const pendiente = state.tareas.filter(t => t.estado === 'pendiente').length || 2;
        const otra = Math.max(0, total - hechas - pendiente) || 1;

        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [hechas, pendiente, otra],
                    backgroundColor: [green, amber, '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4,
                }],
            },
            options: {
                cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
            },
        });

        // Actualizar texto central
        const pct = total ? Math.round((hechas / total) * 100) : 0;
        const center = document.querySelector('.donut-pct');
        if (center) center.textContent = `${pct}%`;
    }

    // — Line chart (evolución de notas) —
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        // Agrupar notas por mes
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const promediosPorMes = [0, 0, 0, 0, 0, 0].map((_, i) => {
            const del_mes = state.notas.filter(n => {
                const d = new Date(n.created_at || n.fecha || Date.now());
                return d.getMonth() === i && n.calificacion != null;
            });
            if (!del_mes.length) return null;
            return +(del_mes.reduce((s, n) => s + parseFloat(n.calificacion), 0) / del_mes.length).toFixed(1);
        });

        // Si no hay datos reales, usar datos de muestra
        const finalData = promediosPorMes.every(v => v === null)
            ? [7.2, 7.8, 8.1, 8.4, 7.9, 8.6]
            : promediosPorMes;

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Promedio',
                    data: finalData,
                    borderColor: purple,
                    backgroundColor: purple + '18',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: purple,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }],
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: grid }, ticks: { font: { size: 11 } } },
                    y: { grid: { color: grid }, ticks: { font: { size: 11 } }, min: 0, max: 10 },
                },
            },
        });
    }
}

/* ══════════════════════════════════════════════════
   PROYECTOS
══════════════════════════════════════════════════ */
async function loadProyectos() {
    const grid = document.getElementById('projects-grid');
    const count = document.getElementById('proj-count');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-msg">Cargando proyectos...</div>';

    try {
        const res = await apiFetch('/proyectos');
        if (!res.ok) throw new Error();
        const data = await res.json();
        state.proyectos = data.data || data.proyectos || (Array.isArray(data) ? data : []);
        renderProyectos(state.proyectos);
        if (count) count.textContent = `${state.proyectos.length} proyecto(s) encontrado(s)`;
    } catch {
        grid.innerHTML = '<div class="error-state">No se pudieron cargar los proyectos.</div>';
    }

    // Búsqueda y filtro
    document.getElementById('proj-search')?.addEventListener('input', filterProyectos);
    document.getElementById('proj-filtro-estado')?.addEventListener('change', filterProyectos);
}

function renderProyectos(list) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    if (!list.length) {
        grid.innerHTML = '<div class="empty-state">No hay proyectos disponibles.</div>';
        return;
    }

    const colors = { activo: 'var(--brand-green)', completado: 'var(--info)', pausado: 'var(--warning)', cancelado: 'var(--danger)' };

    grid.innerHTML = list.map(p => {
        const avance = p.avance ?? Math.floor(Math.random() * 100);
        const color = colors[p.estado] || 'var(--muted)';
        const inicio = formatDate(p.fecha_inicio);
        const limite = formatDate(p.fecha_limite || p.fecha_fin);

        const deleteBtn = isAdminOrDocente()
            ? `<button class="btn btn-danger btn-xs" onclick="deleteProyecto(${p.id_proyecto || p.id})">Eliminar</button>`
            : '';

        return `
      <div class="proj-card" data-id="${p.id_proyecto || p.id}">
        <div class="pc-top">
          <div class="pc-color" style="background:${color}"></div>
          ${pill(p.estado)}
        </div>
        <div class="pc-title">${p.titulo || p.nombre}</div>
        <div class="pc-desc">${p.descripcion || 'Sin descripción.'}</div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${avance}%;background:${color}"></div>
        </div>
        <div class="pc-footer">
          <span>${inicio} → ${limite}</span>
          <span>${avance}% completado</span>
        </div>
        ${deleteBtn ? `<div style="margin-top:.6rem;text-align:right">${deleteBtn}</div>` : ''}
      </div>`;
    }).join('');
}

function filterProyectos() {
    const q = (document.getElementById('proj-search')?.value || '').toLowerCase();
    const est = document.getElementById('proj-filtro-estado')?.value || 'all';
    const lista = state.proyectos.filter(p => {
        const title = (p.titulo || p.nombre || '').toLowerCase();
        const matchQ = !q || title.includes(q) || (p.descripcion || '').toLowerCase().includes(q);
        const matchE = est === 'all' || p.estado === est;
        return matchQ && matchE;
    });
    renderProyectos(lista);
}

window.deleteProyecto = async function (id) {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
        const res = await apiFetch(`/proyectos/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('Proyecto eliminado'); loadProyectos(); }
        else toast('Error al eliminar', 'err');
    } catch { toast('Error de red', 'err'); }
};

/* ── Modal nuevo proyecto ── */
function setupModalProyecto() {
    const btn = document.getElementById('btn-nuevo-proyecto');
    const modal = document.getElementById('modal-proyecto');
    const cancel = document.getElementById('cancel-modal-proyecto');
    const close = document.getElementById('close-modal-proyecto');
    const guardar = document.getElementById('guardar-proyecto-btn');

    btn?.addEventListener('click', () => modal?.classList.remove('hidden'));
    cancel?.addEventListener('click', () => modal?.classList.add('hidden'));
    close?.addEventListener('click', () => modal?.classList.add('hidden'));

    guardar?.addEventListener('click', async () => {
        const titulo = document.getElementById('mp-titulo')?.value.trim();
        const desc = document.getElementById('mp-desc')?.value.trim();
        const inicio = document.getElementById('mp-inicio')?.value;
        const limite = document.getElementById('mp-limite')?.value;
        const msg = document.getElementById('msg-modal-proj');

        if (!titulo) { showMsg(msg, 'El título es obligatorio', 'err'); return; }

        try {
            const res = await apiFetch('/proyectos', {
                method: 'POST',
                body: JSON.stringify({ titulo, descripcion: desc, fecha_inicio: inicio, fecha_limite: limite }),
            });
            const data = await res.json();
            if (res.ok) {
                showMsg(msg, '¡Proyecto creado!', 'ok');
                setTimeout(() => { modal?.classList.add('hidden'); clearForm('mp'); loadProyectos(); }, 1200);
            } else {
                showMsg(msg, data.mensaje || data.error || 'Error al crear', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });
}

/* ══════════════════════════════════════════════════
   TAREAS
══════════════════════════════════════════════════ */
async function loadTareas() {
    const list = document.getElementById('tasks-list');
    const count = document.getElementById('tar-count');
    if (!list) return;

    list.innerHTML = '<div class="loading-msg">Cargando tareas...</div>';

    try {
        const res = await apiFetch('/tareas');
        if (!res.ok) throw new Error();
        const data = await res.json();
        state.tareas = data.data || data.tareas || (Array.isArray(data) ? data : []);
        renderTareas(state.tareas);
        if (count) count.textContent = `${state.tareas.length} tarea(s) asignada(s)`;
    } catch {
        list.innerHTML = '<div class="error-state">No se pudieron cargar las tareas.</div>';
    }

    document.getElementById('tar-search')?.addEventListener('input', filterTareas);
    document.getElementById('tar-filtro-prio')?.addEventListener('change', filterTareas);
    document.getElementById('tar-filtro-estado')?.addEventListener('change', filterTareas);
}

function renderTareas(list) {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<div class="empty-state">No hay tareas disponibles.</div>';
        return;
    }

    const prioColors = { alta: 'var(--danger)', media: 'var(--warning)', baja: 'var(--brand-green)' };

    container.innerHTML = list.map(t => {
        const done = t.estado === 'completada';
        const color = prioColors[t.prioridad] || 'var(--muted)';
        const deleteBtn = isAdminOrDocente()
            ? `<button class="btn btn-danger btn-xs" onclick="deleteTarea(${t.id_tarea || t.id})">✕</button>`
            : '';

        return `
      <div class="tf-row ${done ? 'tf-done' : ''}" data-id="${t.id_tarea || t.id}">
        <div class="tf-check ${done ? 'tf-checked' : ''}"
             onclick="toggleTarea(${t.id_tarea || t.id}, this)"
             title="${done ? 'Marcar pendiente' : 'Marcar completada'}">
          ${done ? '✓' : ''}
        </div>
        <div class="tf-body">
          <div class="tf-title ${done ? 'done' : ''}">${t.titulo}</div>
          <div class="tf-meta">
            <span class="tf-course">${t.proyecto_nombre || 'Sin proyecto'}</span>
            <span class="tf-due">· Vence: ${formatDate(t.fecha_limite)}</span>
            <span class="badge ${done ? 'badge-green' : 'badge-amber'}">${t.estado}</span>
            <span class="badge" style="background:${color}22;color:${color}">
              ${t.prioridad}
            </span>
          </div>
        </div>
        ${deleteBtn}
      </div>`;
    }).join('');
}

function filterTareas() {
    const q = (document.getElementById('tar-search')?.value || '').toLowerCase();
    const prio = document.getElementById('tar-filtro-prio')?.value || 'all';
    const est = document.getElementById('tar-filtro-estado')?.value || 'all';
    const lista = state.tareas.filter(t => {
        const matchQ = !q || (t.titulo || '').toLowerCase().includes(q);
        const matchP = prio === 'all' || t.prioridad === prio;
        const matchE = est === 'all' || t.estado === est;
        return matchQ && matchP && matchE;
    });
    renderTareas(lista);
}

window.toggleTarea = async function (id, el) {
    const row = el.closest('.tf-row');
    const done = !row.classList.contains('tf-done');
    try {
        const res = await apiFetch(`/tareas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ completada: done }),
        });
        if (res.ok) { toast(done ? 'Tarea completada ✓' : 'Marcada como pendiente'); loadTareas(); }
        else toast('No se pudo actualizar', 'err');
    } catch { toast('Error de red', 'err'); }
};

window.deleteTarea = async function (id) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
        const res = await apiFetch(`/tareas/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('Tarea eliminada'); loadTareas(); }
        else toast('Error al eliminar', 'err');
    } catch { toast('Error de red', 'err'); }
};

/* ── Modal nueva tarea ── */
function setupModalTarea() {
    const btn = document.getElementById('btn-nueva-tarea');
    const modal = document.getElementById('modal-tarea');
    const cancel = document.getElementById('cancel-modal-tarea');
    const close = document.getElementById('close-modal-tarea');
    const guardar = document.getElementById('guardar-tarea-btn');

    // Pre-cargar selects
    const openModal = async () => {
        modal?.classList.remove('hidden');
        await fillProyectosSelect('mt-proyecto');
        await fillEstudiantesSelect('mt-estudiante');
    };

    btn?.addEventListener('click', openModal);
    cancel?.addEventListener('click', () => modal?.classList.add('hidden'));
    close?.addEventListener('click', () => modal?.classList.add('hidden'));

    guardar?.addEventListener('click', async () => {
        const titulo = document.getElementById('mt-titulo')?.value.trim();
        const desc = document.getElementById('mt-desc')?.value.trim();
        const proyecto = document.getElementById('mt-proyecto')?.value;
        const asignado = document.getElementById('mt-estudiante')?.value;
        const prioridad = document.getElementById('mt-prioridad')?.value;
        const limite = document.getElementById('mt-limite')?.value;
        const msg = document.getElementById('msg-modal-tar');

        if (!titulo) { showMsg(msg, 'El título es obligatorio', 'err'); return; }

        try {
            const res = await apiFetch('/tareas', {
                method: 'POST',
                body: JSON.stringify({
                    titulo, descripcion: desc,
                    id_proyecto: proyecto || null,
                    id_asignado: asignado || null,
                    prioridad, fecha_limite: limite,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showMsg(msg, '¡Tarea creada!', 'ok');
                setTimeout(() => { modal?.classList.add('hidden'); clearForm('mt'); loadTareas(); }, 1200);
            } else {
                showMsg(msg, data.mensaje || data.error || 'Error al crear', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });
}

/* ══════════════════════════════════════════════════
   NOTAS
══════════════════════════════════════════════════ */
async function loadNotas() {
    const wrap = document.getElementById('grades-wrap');
    const resumen = document.getElementById('notas-resumen');
    if (!wrap) return;

    wrap.innerHTML = '<div class="loading-msg">Cargando notas...</div>';

    try {
        const res = await apiFetch('/evaluaciones');
        if (!res.ok) throw new Error();
        const data = await res.json();
        state.notas = data.data || data.notas || (Array.isArray(data) ? data : []);
        renderNotas(state.notas);

        const calificadas = state.notas.filter(n => n.tipo !== 'falla' && n.calificacion != null);
        const prom = calificadas.length
            ? (calificadas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / calificadas.length).toFixed(1)
            : '—';
        if (resumen) resumen.textContent = `${state.notas.length} evaluaciones · Promedio: ${prom}`;
    } catch {
        wrap.innerHTML = '<div class="error-state">No se pudieron cargar las notas.</div>';
    }

    document.getElementById('notas-search')?.addEventListener('input', filterNotas);
    document.getElementById('notas-filtro-tipo')?.addEventListener('change', filterNotas);
}

function renderNotas(list) {
    const wrap = document.getElementById('grades-wrap');
    if (!wrap) return;
    if (!list.length) {
        wrap.innerHTML = '<div class="empty-state">No hay notas registradas.</div>';
        return;
    }

    // Agrupar por proyecto
    const byProj = {};
    list.forEach(n => {
        const key = n.proyecto_nombre || n.id_proyecto || 'General';
        if (!byProj[key]) byProj[key] = [];
        byProj[key].push(n);
    });

    const calClass = (cal) => {
        if (cal === null || cal === undefined) return '';
        const v = parseFloat(cal);
        if (v >= 8) return 'high';
        if (v >= 6) return 'ok';
        return 'warn';
    };

    wrap.innerHTML = Object.entries(byProj).map(([proj, notas]) => {
        const calificadas = notas.filter(n => n.tipo !== 'falla' && n.calificacion != null);
        const prom = calificadas.length
            ? (calificadas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / calificadas.length).toFixed(1)
            : '—';

        const deleteBtn = isAdminOrDocente()
            ? (id) => `<button class="btn btn-danger btn-xs" onclick="deleteNota(${id})" style="margin-left:auto">✕</button>`
            : () => '';

        return `
      <div class="grade-card">
        <div class="gc-header">
          <div class="gc-course">${proj}</div>
        </div>
        <div class="gc-rows">
          ${notas.map(n => `
            <div class="gc-row">
              <span>${n.titulo || n.tipo}</span>
              ${deleteBtn(n.id_nota || n.id)}
              <span class="gcv ${calClass(n.calificacion)}">
                ${n.tipo === 'falla' ? '🚫 Falla' : (n.calificacion ?? '—')}
              </span>
            </div>`).join('')}
        </div>
        <div class="gc-avg">
          <span>Promedio</span>
          <span class="gc-avg-val ${calClass(prom)}">${prom}</span>
        </div>
      </div>`;
    }).join('');
}

function filterNotas() {
    const q = (document.getElementById('notas-search')?.value || '').toLowerCase();
    const tipo = document.getElementById('notas-filtro-tipo')?.value || 'all';
    const lista = state.notas.filter(n => {
        const matchQ = !q || (n.titulo || '').toLowerCase().includes(q) || (n.proyecto_nombre || '').toLowerCase().includes(q);
        const matchT = tipo === 'all' || n.tipo === tipo;
        return matchQ && matchT;
    });
    renderNotas(lista);
}

window.deleteNota = async function (id) {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
        const res = await apiFetch(`/evaluaciones/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('Nota eliminada'); loadNotas(); }
        else toast('Error al eliminar', 'err');
    } catch { toast('Error de red', 'err'); }
};

/* ── Modal registrar nota ── */
function setupModalNota() {
    const btn = document.getElementById('btn-nueva-nota');
    const modal = document.getElementById('modal-nota');
    const cancel = document.getElementById('cancel-modal-nota');
    const close = document.getElementById('close-modal-nota');
    const guardar = document.getElementById('guardar-nota-btn');
    const tipo = document.getElementById('mn2-tipo');
    const calWrap = document.getElementById('cal-wrap');

    // Ocultar calificación si es falla
    tipo?.addEventListener('change', () => {
        if (calWrap) calWrap.style.display = tipo.value === 'falla' ? 'none' : '';
    });

    const openModal = async () => {
        modal?.classList.remove('hidden');
        await fillProyectosSelect('mn2-proyecto');
        await fillEstudiantesSelect('mn2-estudiante');
    };

    btn?.addEventListener('click', openModal);
    cancel?.addEventListener('click', () => modal?.classList.add('hidden'));
    close?.addEventListener('click', () => modal?.classList.add('hidden'));

    guardar?.addEventListener('click', async () => {
        const id_proyecto = document.getElementById('mn2-proyecto')?.value;
        const id_estudiante = document.getElementById('mn2-estudiante')?.value;
        const tipoV = document.getElementById('mn2-tipo')?.value;
        const cal = document.getElementById('mn2-cal')?.value;
        const titulo = document.getElementById('mn2-titulo')?.value.trim();
        const comentarios = document.getElementById('mn2-comentarios')?.value.trim();
        const msg = document.getElementById('msg-modal-nota');

        if (!titulo) { showMsg(msg, 'La descripción es obligatoria', 'err'); return; }

        try {
            const res = await apiFetch('/evaluaciones', {
                method: 'POST',
                body: JSON.stringify({
                    id_proyecto: id_proyecto || null,
                    id_estudiante: id_estudiante || null,
                    tipo: tipoV,
                    calificacion: tipoV === 'falla' ? null : (cal || null),
                    titulo, comentarios,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showMsg(msg, '¡Nota registrada!', 'ok');
                setTimeout(() => { modal?.classList.add('hidden'); clearForm('mn2'); loadNotas(); }, 1200);
            } else {
                showMsg(msg, data.mensaje || data.error || 'Error al registrar', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });
}

/* ══════════════════════════════════════════════════
   NOTICIAS
══════════════════════════════════════════════════ */
async function loadNoticias() {
    const grid = document.getElementById('news-grid');
    const count = document.getElementById('news-count');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-msg">Cargando noticias...</div>';

    try {
        const res = await apiFetch('/noticias');
        if (!res.ok) throw new Error();
        const data = await res.json();
        state.noticias = data.data || data.noticias || (Array.isArray(data) ? data : []);
        renderNoticias(state.noticias);
        if (count) count.textContent = `${state.noticias.length} noticia(s)`;
    } catch {
        grid.innerHTML = '<div class="error-state">No se pudieron cargar las noticias.</div>';
    }

    document.getElementById('news-search')?.addEventListener('input', filterNoticias);
    document.getElementById('news-filtro')?.addEventListener('change', filterNoticias);
}

function renderNoticias(list) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    if (!list.length) {
        grid.innerHTML = '<div class="empty-state">No hay noticias disponibles.</div>';
        return;
    }

    const catClass = { academico: 'nc-imp', taller: 'nc-tech', infra: 'nc-info', logro: 'nc-ai' };
    const catLabel = { academico: '📅 Académico', taller: '🛠 Taller', infra: '🏗 Infraestructura', logro: '🏆 Logro' };

    const editDel = (n) => isAdminOrDocente()
        ? `<div style="margin-top:.5rem;display:flex;gap:.4rem">
        <button class="btn btn-ghost btn-xs" onclick="editNoticia(${n.id})">✏️</button>
        <button class="btn btn-danger btn-xs" onclick="deleteNoticia(${n.id})">🗑</button>
       </div>`
        : '';

    grid.innerHTML = list.map((n, i) => {
        const feat = (i === 0 && n.destacada) ? 'news-feat' : '';
        const imgHtml = n.imagen_url
            ? `<div class="news-img-wrap"><img class="news-img" src="${n.imagen_url}" alt="${n.titulo}" loading="lazy"/></div>`
            : '';
        return `
      <div class="news-card ${feat}">
        ${imgHtml}
        <div style="padding:${imgHtml ? '.85rem' : '0'} 0 0">
          <span class="news-cat ${catClass[n.categoria] || 'nc-info'}">
            ${n.emoji || ''} ${catLabel[n.categoria] || n.categoria}
          </span>
          <div class="news-h">${n.titulo}</div>
          <div class="news-b">${n.contenido?.substring(0, 200)}${n.contenido?.length > 200 ? '…' : ''}</div>
          <div class="news-m">${formatDate(n.fecha || n.created_at)}</div>
          ${editDel(n)}
        </div>
      </div>`;
    }).join('');
}

function filterNoticias() {
    const q = (document.getElementById('news-search')?.value || '').toLowerCase();
    const cat = document.getElementById('news-filtro')?.value || 'all';
    const lista = state.noticias.filter(n => {
        const matchQ = !q || (n.titulo || '').toLowerCase().includes(q);
        const matchC = cat === 'all' || n.categoria === cat;
        return matchQ && matchC;
    });
    renderNoticias(lista);
}

window.deleteNoticia = async function (id) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try {
        const res = await apiFetch(`/noticias/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('Noticia eliminada'); loadNoticias(); }
        else toast('Error al eliminar', 'err');
    } catch { toast('Error de red', 'err'); }
};

window.editNoticia = function (id) {
    const n = state.noticias.find(x => x.id === id);
    if (!n) return;
    document.getElementById('mn-titulo') && (document.getElementById('mn-titulo').value = n.titulo || '');
    document.getElementById('mn-contenido') && (document.getElementById('mn-contenido').value = n.contenido || '');
    document.getElementById('mn-categoria') && (document.getElementById('mn-categoria').value = n.categoria || 'academico');
    document.getElementById('mn-emoji') && (document.getElementById('mn-emoji').value = n.emoji || '');
    // Guardar ID de edición
    const modal = document.getElementById('modal-noticia');
    if (modal) { modal.dataset.editId = id; modal.classList.remove('hidden'); }
    document.getElementById('modal-noticia-title') && (document.getElementById('modal-noticia-title').textContent = 'Editar noticia');
    document.getElementById('btn-publicar') && (document.getElementById('btn-publicar').textContent = 'Guardar cambios');
};

/* ── Modal noticia ── */
function setupModalNoticia() {
    const btn = document.getElementById('btn-nueva-noticia');
    const modal = document.getElementById('modal-noticia');
    const cancel = document.getElementById('cancel-modal-noticia');
    const close = document.getElementById('close-modal-noticia');
    const guardar = document.getElementById('btn-publicar');
    const imgArea = document.getElementById('img-upload-area');
    const imgInput = document.getElementById('mn-imagen');
    const preview = document.getElementById('img-preview');
    const quitImg = document.getElementById('btn-quitar-img');
    const placeholder = document.getElementById('img-placeholder');

    btn?.addEventListener('click', () => {
        modal && (modal.dataset.editId = '');
        document.getElementById('modal-noticia-title') && (document.getElementById('modal-noticia-title').textContent = 'Nueva noticia');
        document.getElementById('btn-publicar') && (document.getElementById('btn-publicar').textContent = 'Publicar noticia');
        clearForm('mn');
        modal?.classList.remove('hidden');
    });

    cancel?.addEventListener('click', () => modal?.classList.add('hidden'));
    close?.addEventListener('click', () => modal?.classList.add('hidden'));

    // Preview imagen
    imgArea?.addEventListener('click', () => imgInput?.click());
    imgInput?.addEventListener('change', () => {
        const file = imgInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
            if (placeholder) placeholder.style.display = 'none';
            if (quitImg) quitImg.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    });

    quitImg?.addEventListener('click', () => {
        if (imgInput) imgInput.value = '';
        if (preview) { preview.src = ''; preview.classList.add('hidden'); }
        if (placeholder) placeholder.style.display = '';
        if (quitImg) quitImg.style.display = 'none';
    });

    guardar?.addEventListener('click', async () => {
        const titulo = document.getElementById('mn-titulo')?.value.trim();
        const contenido = document.getElementById('mn-contenido')?.value.trim();
        const categoria = document.getElementById('mn-categoria')?.value;
        const emoji = document.getElementById('mn-emoji')?.value.trim();
        const destacada = document.getElementById('mn-destacada')?.checked;
        const msg = document.getElementById('msg-modal-noticia');
        const editId = modal?.dataset.editId;

        if (!titulo || !contenido) { showMsg(msg, 'Título y contenido son obligatorios', 'err'); return; }

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('contenido', contenido);
        formData.append('categoria', categoria);
        formData.append('emoji', emoji);
        formData.append('destacada', destacada ? '1' : '0');
        if (imgInput?.files?.[0]) formData.append('imagen', imgInput.files[0]);

        try {
            const method = editId ? 'PUT' : 'POST';
            const endpoint = editId ? `/noticias/${editId}` : '/noticias';
            const res = await fetch(`${API}${endpoint}`, {
                method,
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                showMsg(msg, editId ? 'Noticia actualizada' : '¡Noticia publicada!', 'ok');
                setTimeout(() => { modal?.classList.add('hidden'); clearForm('mn'); loadNoticias(); }, 1200);
            } else {
                showMsg(msg, data.error || 'Error al guardar', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });
}

/* ══════════════════════════════════════════════════
   USUARIOS (admin)
══════════════════════════════════════════════════ */
async function loadUsuarios() {
    const tbody = document.getElementById('users-tbody');
    const label = document.getElementById('users-count-label');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Cargando usuarios...</td></tr>';

    try {
        const res = await apiFetch('/usuarios');
        if (!res.ok) throw new Error();
        const data = await res.json();
        state.usuarios = data.data || data.usuarios || (Array.isArray(data) ? data : []);
        renderUsuarios(state.usuarios);
        if (label) label.textContent = `Usuarios registrados (${state.usuarios.length})`;
    } catch {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell" style="color:var(--danger)">Error al cargar usuarios.</td></tr>';
    }

    document.getElementById('users-search')?.addEventListener('input', filterUsuarios);
    document.getElementById('users-filtro-rol')?.addEventListener('change', filterUsuarios);
}

function renderUsuarios(list) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No hay usuarios.</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(u => `
    <tr>
      <td><strong>${u.nombre} ${u.apellido || ''}</strong></td>
      <td>${u.email}</td>
      <td>${pill(u.rol)}</td>
      <td>${pill(u.estado || 'activo')}</td>
      <td>
        <button class="btn btn-danger btn-xs" onclick="deleteUsuario(${u.id_usuario || u.id})">Eliminar</button>
      </td>
    </tr>`).join('');
}

function filterUsuarios() {
    const q = (document.getElementById('users-search')?.value || '').toLowerCase();
    const rol = document.getElementById('users-filtro-rol')?.value || 'all';
    const lista = state.usuarios.filter(u => {
        const name = `${u.nombre} ${u.apellido || ''} ${u.email}`.toLowerCase();
        return (!q || name.includes(q)) && (rol === 'all' || u.rol === rol);
    });
    renderUsuarios(lista);
}

window.deleteUsuario = async function (id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
        const res = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('Usuario eliminado'); loadUsuarios(); }
        else toast('No se pudo eliminar', 'err');
    } catch { toast('Error de red', 'err'); }
};

/* ── Modal crear usuario ── */
function setupModalUsuario() {
    const btn = document.getElementById('btn-crear-usuario');
    const modal = document.getElementById('modal-usuario');
    const cancel = document.getElementById('cancel-modal-usuario');
    const close = document.getElementById('close-modal-usuario');
    const crear = document.getElementById('crear-usuario-btn');
    const cerrar = document.getElementById('close-temp-pass-btn');
    const actions = document.getElementById('modal-usuario-actions');
    const passBox = document.getElementById('temp-pass-box');

    btn?.addEventListener('click', () => {
        clearForm('mu');
        actions?.classList.remove('hidden');
        passBox?.classList.add('hidden');
        modal?.classList.remove('hidden');
    });
    cancel?.addEventListener('click', () => modal?.classList.add('hidden'));
    close?.addEventListener('click', () => modal?.classList.add('hidden'));
    cerrar?.addEventListener('click', () => { modal?.classList.add('hidden'); loadUsuarios(); });

    crear?.addEventListener('click', async () => {
        const nombre = document.getElementById('mu-nombre')?.value.trim();
        const apellido = document.getElementById('mu-apellido')?.value.trim();
        const email = document.getElementById('mu-email')?.value.trim();
        const documento = document.getElementById('mu-documento')?.value.trim();
        const rol = document.getElementById('mu-rol')?.value;
        const msg = document.getElementById('msg-modal');

        if (!nombre || !email || !documento) { showMsg(msg, 'Nombre, correo y documento son obligatorios', 'err'); return; }

        try {
            const res = await apiFetch('/auth/registro', {
                method: 'POST',
                body: JSON.stringify({ nombre, apellido, email, documento, rol }),
            });
            const data = await res.json();
            if (res.ok) {
                actions?.classList.add('hidden');
                passBox?.classList.remove('hidden');
                const passEl = document.getElementById('temp-pass-val');
                if (passEl) passEl.textContent = data.contrasena_temporal || data.password_temporal || data.password || documento;
            } else {
                showMsg(msg, data.mensaje || data.error || 'Error al crear usuario', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });
}

/* ══════════════════════════════════════════════════
   PERFIL
══════════════════════════════════════════════════ */
async function loadPerfil() {
    const u = state.user;
    if (!u) return;

    document.getElementById('prof-name')?.setAttribute('textContent', `${u.nombre} ${u.apellido || ''}`);
    document.getElementById('prof-name') && (document.getElementById('prof-name').textContent = `${u.nombre} ${u.apellido || ''}`);
    document.getElementById('prof-sub') && (document.getElementById('prof-sub').textContent = u.email || '—');

    document.getElementById('pm-rol') && (document.getElementById('pm-rol').textContent = u.rol || '—');

    // Métricas
    const proyectos = state.proyectos.length;
    const completadas = state.tareas.filter(t => t.estado === 'completada').length;
    const calificadas = state.notas.filter(n => n.tipo !== 'falla' && n.calificacion != null);
    const prom = calificadas.length
        ? (calificadas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / calificadas.length).toFixed(1)
        : '—';

    document.getElementById('pm-promedio') && (document.getElementById('pm-promedio').textContent = prom);
    document.getElementById('pm-proyectos') && (document.getElementById('pm-proyectos').textContent = proyectos);
    document.getElementById('pm-tareas') && (document.getElementById('pm-tareas').textContent = completadas);

    // Cargar perfil extendido
    try {
        const res = await apiFetch('/perfil');
        if (res.ok) {
            const data = await res.json();
            const base = data.data || data.perfil || data;
            const p = { ...base, ...(base.perfil || {}) };
            renderPerfilDatos(p);
            renderPerfilEdit(p);
        }
    } catch { renderPerfilDatos({}); }

    // Botón editar
    document.getElementById('btn-editar-perfil')?.addEventListener('click', () => {
        document.getElementById('perfil-view')?.classList.add('hidden');
        document.getElementById('perfil-edit')?.classList.remove('hidden');
    });

    document.getElementById('cancel-edit-perfil')?.addEventListener('click', () => {
        document.getElementById('perfil-view')?.classList.remove('hidden');
        document.getElementById('perfil-edit')?.classList.add('hidden');
    });

    document.getElementById('guardar-perfil-btn')?.addEventListener('click', guardarPerfil);
}

function renderPerfilDatos(p) {
    const datos = document.getElementById('perfil-datos');
    const contacto = document.getElementById('perfil-contacto');
    if (datos) {
        datos.innerHTML = [
            ['Nacimiento', formatDate(p.fecha_nacimiento)],
            ['Ciudad', p.ciudad || '—'],
            ['Teléfono', p.telefono || '—'],
            ['Semestre', p.semestre || '—'],
            ['Programa', p.programa || '—'],
        ].map(([lbl, val]) => `
      <div>
        <div class="pdl">${lbl}</div>
        <div class="pdv">${escapeHTML(val)}</div>
      </div>`).join('');
    }
    if (contacto) {
        contacto.innerHTML = [
            ['Nombre', p.contacto_nombre || '—'],
            ['Teléfono', p.contacto_telefono || '—'],
            ['Relación', p.contacto_relacion || '—'],
            ['Correo', p.contacto_email || '—'],
        ].map(([lbl, val]) => `
      <div>
        <div class="pdl">${lbl}</div>
        <div class="pdv">${escapeHTML(val)}</div>
      </div>`).join('');
    }
}

function renderPerfilEdit(p) {
    const campos = {
        'ep-nacimiento': p.fecha_nacimiento?.split('T')[0] || '',
        'ep-ciudad': p.ciudad || '',
        'ep-telefono': p.telefono || '',
        'ep-semestre': p.semestre || '',
        'ep-programa': p.programa || '',
        'ep-c-nombre': p.contacto_nombre || '',
        'ep-c-telefono': p.contacto_telefono || '',
        'ep-c-relacion': p.contacto_relacion || '',
        'ep-c-email': p.contacto_email || '',
    };
    Object.entries(campos).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });
    const menorCheck = document.getElementById('ep-menor');
    if (menorCheck && p.fecha_nacimiento) {
        const edad = Math.floor((Date.now() - new Date(p.fecha_nacimiento)) / (365.25 * 86400000));
        menorCheck.checked = edad < 18;
    }
}

async function guardarPerfil() {
    const u = state.user;
    const msg = document.getElementById('msg-perfil');
    const payload = {
        fecha_nacimiento: document.getElementById('ep-nacimiento')?.value || null,
        ciudad: document.getElementById('ep-ciudad')?.value || null,
        telefono: document.getElementById('ep-telefono')?.value || null,
        semestre: document.getElementById('ep-semestre')?.value || null,
        programa: document.getElementById('ep-programa')?.value || null,
        contacto_nombre: document.getElementById('ep-c-nombre')?.value || null,
        contacto_telefono: document.getElementById('ep-c-telefono')?.value || null,
        contacto_relacion: document.getElementById('ep-c-relacion')?.value || null,
        contacto_email: document.getElementById('ep-c-email')?.value || null,
    };
    try {
        const res = await apiFetch('/perfil', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            showMsg(msg, '¡Perfil guardado!', 'ok');
            setTimeout(() => {
                document.getElementById('perfil-view')?.classList.remove('hidden');
                document.getElementById('perfil-edit')?.classList.add('hidden');
                loadPerfil();
            }, 1200);
        } else {
            const data = await res.json();
            showMsg(msg, data.error || 'Error al guardar', 'err');
        }
    } catch { showMsg(msg, 'Error de red', 'err'); }
}

/* ══════════════════════════════════════════════════
   ASISTENTE IA
══════════════════════════════════════════════════ */
function setupAIAssistant() {
    const inp = document.getElementById('ai-inp');
    const btn = document.getElementById('ai-send-btn');
    const msgs = document.getElementById('ai-msgs');
    const chips = document.querySelectorAll('.ai-chip');

    if (!inp || !btn || !msgs) return;

    const send = async () => {
        const text = inp.value.trim();
        if (!text) return;

        appendMsg(text, 'user');
        inp.value = '';

        const typing = appendTyping();

        try {
            const res = await apiFetch('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ mensaje: text }),
            });
            typing.remove();
            if (res.ok) {
                const data = await res.json();
                appendMsg(data.respuesta || data.message || 'Sin respuesta', 'bot');
            } else {
                appendMsg('⚠️ No pude conectarme al asistente. Verifica tu conexión.', 'bot');
            }
        } catch {
            typing.remove();
            appendMsg('⚠️ Error de red. El asistente no está disponible ahora.', 'bot');
        }
    };

    btn.addEventListener('click', send);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            inp.value = chip.dataset.msg || chip.textContent;
            send();
        });
    });

    function appendMsg(text, role) {
        const div = document.createElement('div');
        div.className = `ai-msg ${role}`;
        const isBot = role === 'bot';
        div.innerHTML = `
      ${isBot ? `<div class="ai-av"><svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg></div>` : ''}
      <div class="ai-bub ${isBot ? '' : 'user-bub'}">${text}</div>`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return div;
    }

    function appendTyping() {
        const div = document.createElement('div');
        div.className = 'ai-msg bot';
        div.innerHTML = `<div class="ai-av"></div><div class="ai-bub typing"><span></span><span></span><span></span></div>`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return div;
    }
}

/* ══════════════════════════════════════════════════
   REPORTES
══════════════════════════════════════════════════ */
function setupReportes() {
    document.querySelectorAll('[data-pdf-url]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const url = btn.dataset.pdfUrl;
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.textContent = 'Generando...';
            try {
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token()}` } });
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = url.split('/').pop();
                link.click();
                toast('PDF descargado ✓');
            } catch {
                toast('Error al generar el PDF', 'err');
            } finally {
                btn.disabled = false;
                btn.innerHTML = original;
            }
        });
    });
}

/* ══════════════════════════════════════════════════
   HELPERS DE MODALES
══════════════════════════════════════════════════ */
function setupModalListeners() {
    setupModalProyecto();
    setupModalTarea();
    setupModalNota();
    setupModalNoticia();
    setupModalUsuario();

    // Cerrar al hacer clic en el overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });
}

function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `form-msg show msg-${type}`;
    setTimeout(() => { el.className = 'form-msg'; el.textContent = ''; }, 4000);
}

function clearForm(prefix) {
    document.querySelectorAll(`[id^="${prefix}-"]`).forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = '';
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        if (el.type === 'checkbox') el.checked = false;
    });
}

async function fillProyectosSelect(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    if (state.proyectos.length === 0) {
        const res = await apiFetch('/proyectos');
        if (res.ok) { const d = await res.json(); state.proyectos = d.data || d.proyectos || (Array.isArray(d) ? d : []); }
    }
    sel.innerHTML = '<option value="">Selecciona proyecto...</option>' +
        state.proyectos.map(p => `<option value="${p.id_proyecto || p.id}">${p.titulo || p.nombre}</option>`).join('');
}

async function fillEstudiantesSelect(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    try {
        const res = await apiFetch('/usuarios?rol=estudiante');
        if (res.ok) {
            const data = await res.json();
            const estudiantes = (data.usuarios || data).filter(u => u.rol === 'estudiante');
            sel.innerHTML = '<option value="">Selecciona estudiante...</option>' +
                estudiantes.map(u => `<option value="${u.id_usuario || u.id}">${u.nombre} ${u.apellido || ''}</option>`).join('');
        }
    } catch { /* silencioso */ }
}