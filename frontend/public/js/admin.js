/* ═══════════════════════════════════════════════════════════
   admin.js — EduHub Panel Administración v4.1
   Lógica completa: KPIs, CRUD de usuarios/proyectos,
   evaluaciones, noticias, reportes y gráficas.
═══════════════════════════════════════════════════════════ */

const API = window.EduHubConfig?.API_BASE || 'http://localhost:3000/api';

/* ─── Estado global admin ─── */
const adminState = {
    usuarios: [],
    proyectos: [],
    evaluaciones: [],
    noticias: [],
};

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) return redirect('login.html');

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.rol !== 'admin') {
            alert('Acceso restringido al panel de administración.');
            return redirect('dashboard.html');
        }
    } catch {
        return redirect('login.html');
    }

    initAdmin();
});

function initAdmin() {
    setupNav();
    setupSidebar();
    setupTheme();
    setupModales();
    setupPerfil();
    loadAllData();

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.clear();
        redirect('login.html');
    });
}

/* ══════════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════════ */
function redirect(p) { window.location.href = p; }

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
    // Si el dashboard tiene toast nativo lo usamos, si no creamos uno básico
    let el = document.getElementById('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'admin-toast';
        el.style.cssText = `
      position:fixed;bottom:24px;right:24px;padding:.65rem 1.1rem;
      border-radius:10px;font-family:var(--font-display,sans-serif);font-size:.82rem;font-weight:600;
      z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2);
      background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);color:var(--text,#111);
      display:flex;align-items:center;gap:8px;animation:fadeUp .2s ease;
    `;
        document.body.appendChild(el);
    }
    const color = type === 'ok' ? '#22c55e' : '#ef4444';
    el.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>${msg}`;
    el.style.display = 'flex';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badge(val, type) {
    const map = {
        admin: 'style="background:#fef2f2;color:#ef4444"',
        docente: 'style="background:#eff6ff;color:#3b82f6"',
        estudiante: 'style="background:#f0fdf4;color:#22c55e"',
        activo: 'style="background:#f0fdf4;color:#22c55e"',
        inactivo: 'style="background:#fef2f2;color:#ef4444"',
        completado: 'style="background:#eff6ff;color:#3b82f6"',
        pausado: 'style="background:#fffbeb;color:#f59e0b"',
        cancelado: 'style="background:#fef2f2;color:#ef4444"',
    };
    const style = map[val] || 'style="background:#f3f4f6;color:#6b7280"';
    return `<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:100px;
    font-size:.68rem;font-weight:700;font-family:var(--font-display,sans-serif)" ${style}>${val}</span>`;
}

/* ══════════════════════════════════════════════════
   SIDEBAR & TEMA
══════════════════════════════════════════════════ */
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sb-overlay');
    const openBtn = document.getElementById('sb-open-btn');
    const closeBtn = document.getElementById('sb-close-btn');

    openBtn?.addEventListener('click', () => { sidebar?.classList.add('open'); overlay?.classList.add('show'); });
    closeBtn?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); });
    overlay?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); });
}

function setupTheme() {
    // El tema lo gestiona theme.js (anti-FOUC + toggle + labels).
    // Aquí solo registramos el rebuild del gráfico cuando cambia data-theme.
    const observer = new MutationObserver(() => {
        if (window._adminChart) { window._adminChart.destroy(); buildAdminChart(); }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/* ══════════════════════════════════════════════════
   PERFIL
══════════════════════════════════════════════════ */
function setupPerfil() {
    // Botón editar perfil (ahora es el avatar completo)
    document.getElementById('btn-editar-perfil')?.addEventListener('click', () => {
        document.getElementById('perfil-view')?.classList.add('hidden');
        document.getElementById('perfil-edit')?.classList.remove('hidden');
    });

    // Cancelar edición
    document.getElementById('cancel-edit-perfil')?.addEventListener('click', () => {
        document.getElementById('perfil-view')?.classList.remove('hidden');
        document.getElementById('perfil-edit')?.classList.add('hidden');
    });

    // La implementación real de perfil se define al final del archivo.
    document.getElementById('guardar-perfil-btn')?.addEventListener('click', () => {
        toast('Perfil actualizado correctamente');
        document.getElementById('perfil-view')?.classList.remove('hidden');
        document.getElementById('perfil-edit')?.classList.add('hidden');
    });
}

/* ══════════════════════════════════════════════════
   NAVEGACIÓN
══════════════════════════════════════════════════ */
function setupNav() {
    const navItems = document.querySelectorAll('.nav-item[data-sec]');
    const sections = document.querySelectorAll('.sec');
    const tbTitle = document.getElementById('tb-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.tagName === 'A') return; // enlaces normales

            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            const sec = document.getElementById(`sec-${item.dataset.sec}`);
            if (sec) sec.classList.add('active', 'fade-up');

            const label = item.querySelector('span:not(.ni-badge)');
            if (tbTitle && label) tbTitle.textContent = label.textContent.trim();

            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sb-overlay')?.classList.remove('show');

            // Carga lazy por sección
            const sec_id = item.dataset.sec;
            if (sec_id === 'usuarios') renderUsuarios(adminState.usuarios);
            if (sec_id === 'proyectos') renderProyectos(adminState.proyectos);
            if (sec_id === 'evaluaciones') renderEvaluaciones(adminState.evaluaciones);
            if (sec_id === 'noticias') renderNoticias(adminState.noticias);
        });
    });
}

/* ══════════════════════════════════════════════════
   CARGA INICIAL DE DATOS
══════════════════════════════════════════════════ */
async function loadAllData() {
    try {
        const [rU, rP, rE, rN] = await Promise.all([
            apiFetch('/usuarios'),
            apiFetch('/proyectos'),
            apiFetch('/evaluaciones'),
            apiFetch('/noticias'),
        ]);

        if (rU.ok) { const d = await rU.json(); adminState.usuarios = d.data || d.usuarios || d; }
        if (rP.ok) { const d = await rP.json(); adminState.proyectos = d.data || d.proyectos || d; }
        if (rE.ok) { const d = await rE.json(); adminState.evaluaciones = d.data || d.notas || d; }
        if (rN.ok) { const d = await rN.json(); adminState.noticias = d.data || d.noticias || d; }

        updateKPIs();
        buildAdminChart();

    } catch (e) {
        console.error('[Admin] Error cargando datos:', e);
        // Mostrar datos vacíos en lugar de crash
        updateKPIs();
        buildAdminChart();
    }
}

/* ══════════════════════════════════════════════════
   KPIs
══════════════════════════════════════════════════ */
function updateKPIs() {
    const activos = adminState.proyectos.filter(p => p.estado === 'activo').length;

    animateCounter('kpi-usuarios', adminState.usuarios.length);
    animateCounter('kpi-proyectos', activos);
    animateCounter('kpi-evaluaciones', adminState.evaluaciones.length);
    animateCounter('kpi-noticias', adminState.noticias.length);
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString('es-CO');
    }, 30);
}

/* ══════════════════════════════════════════════════
   GRÁFICA PRINCIPAL ADMIN
══════════════════════════════════════════════════ */
function buildAdminChart() {
    const ctx = document.getElementById('admin-chart-main');
    if (!ctx) return;

    if (window._adminChart) window._adminChart.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const lbl = isDark ? '#888' : '#999';

    Chart.defaults.font.family = "'Syne', 'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = lbl;

    // Distribución de roles
    const students = adminState.usuarios.filter(u => u.rol === 'estudiante').length;
    const docentes = adminState.usuarios.filter(u => u.rol === 'docente').length;
    const admins = adminState.usuarios.filter(u => u.rol === 'admin').length;

    // Estado de proyectos
    const porEstado = {
        activo: adminState.proyectos.filter(p => p.estado === 'activo').length,
        completado: adminState.proyectos.filter(p => p.estado === 'completado').length,
        pausado: adminState.proyectos.filter(p => p.estado === 'pausado').length,
        cancelado: adminState.proyectos.filter(p => p.estado === 'cancelado').length,
    };

    window._adminChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Estudiantes', 'Docentes', 'Admins', 'Proy. Activos', 'Proy. Completados', 'Proy. Pausados', 'Evaluaciones', 'Noticias'],
            datasets: [{
                label: 'Cantidad',
                data: [
                    students, docentes, admins,
                    porEstado.activo, porEstado.completado, porEstado.pausado,
                    adminState.evaluaciones.length,
                    adminState.noticias.length,
                ],
                backgroundColor: [
                    '#22c55e55', '#3b82f655', '#ef444455',
                    '#22c55e55', '#38bdf855', '#f59e0b55',
                    '#7A2E8A55', '#f97316' + '55',
                ],
                borderColor: [
                    '#22c55e', '#3b82f6', '#ef4444',
                    '#22c55e', '#38bdf8', '#f59e0b',
                    '#7A2E8A', '#f97316',
                ],
                borderWidth: 1.5,
                borderRadius: 6,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} registros` } },
            },
            scales: {
                x: { grid: { color: grid }, ticks: { font: { size: 11 } } },
                y: { grid: { color: grid }, ticks: { font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
            },
        },
    });
}

/* ══════════════════════════════════════════════════
   TABLA USUARIOS
══════════════════════════════════════════════════ */
function renderUsuarios(list) {
    const tbody = document.getElementById('usuarios-body');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--muted)">No hay usuarios registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(u => `
    <tr style="border-bottom:1px solid var(--border);transition:background .12s" 
        onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
      <td style="padding:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--brand-green,#22c55e);
               display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.8rem;flex-shrink:0">
            ${(u.nombre?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600;font-size:.85rem">${u.nombre} ${u.apellido || ''}</div>
          </div>
        </div>
      </td>
      <td style="padding:12px;font-size:.82rem;color:var(--muted)">${u.email}</td>
      <td style="padding:12px;font-family:monospace;font-size:.8rem">${u.documento || '—'}</td>
      <td style="padding:12px">${badge(u.rol)}</td>
      <td style="padding:12px">${badge(u.estado || 'activo')}</td>
      <td style="padding:12px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-xs" onclick="editarUsuario(${u.id_usuario || u.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-xs" onclick="eliminarUsuario(${u.id_usuario || u.id})">🗑 Eliminar</button>
      </td>
    </tr>`).join('');
}

window.editarUsuario = function (id) {
    const u = adminState.usuarios.find(x => (x.id_usuario || x.id) === id);
    if (!u) return;
    const modal = document.getElementById('modal-usuario-edit') || crearModalUsuarioEdit();
    
    document.getElementById('eu-id') && (document.getElementById('eu-id').value = id);
    document.getElementById('eu-nombre') && (document.getElementById('eu-nombre').value = u.nombre || '');
    document.getElementById('eu-apellido') && (document.getElementById('eu-apellido').value = u.apellido || '');
    document.getElementById('eu-email') && (document.getElementById('eu-email').value = u.email || '');
    document.getElementById('eu-documento') && (document.getElementById('eu-documento').value = u.documento || '');
    document.getElementById('eu-rol') && (document.getElementById('eu-rol').value = u.rol || 'estudiante');
    modal.classList.remove('hidden');
};

window.eliminarUsuario = async function (id) {
    if (!confirm('¿Eliminar permanentemente este usuario?')) return;
    try {
        const res = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast('Usuario eliminado');
            adminState.usuarios = adminState.usuarios.filter(u => (u.id_usuario || u.id) !== id);
            renderUsuarios(adminState.usuarios);
            updateKPIs();
            buildAdminChart();
        } else {
            toast('No se pudo eliminar', 'err');
        }
    } catch { toast('Error de red', 'err'); }
};

/* ══════════════════════════════════════════════════
   TABLA PROYECTOS
══════════════════════════════════════════════════ */
function renderProyectos(list) {
    const tbody = document.getElementById('proyectos-body');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--muted)">No hay proyectos.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => {
        const avance = p.avance ?? 0;
        const color = { activo: '#22c55e', completado: '#38bdf8', pausado: '#f59e0b', cancelado: '#ef4444' }[p.estado] || '#999';

        return `
      <tr style="border-bottom:1px solid var(--border)" 
          onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
        <td style="padding:12px;font-weight:600;font-size:.85rem">${p.titulo || p.nombre}</td>
        <td style="padding:12px;font-size:.82rem;color:var(--muted)">${p.lider_nombre || p.creador || '—'}</td>
        <td style="padding:12px">${badge(p.estado)}</td>
        <td style="padding:12px;min-width:120px">
          <div style="height:6px;background:var(--bg2,#f3f4f6);border-radius:100px;overflow:hidden;margin-bottom:3px">
            <div style="height:100%;width:${avance}%;background:${color};border-radius:100px;transition:width .5s"></div>
          </div>
          <span style="font-size:.72rem;color:var(--muted)">${avance}%</span>
        </td>
        <td style="padding:12px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-xs" onclick="editarProyecto(${p.id_proyecto || p.id})">✏️ Editar</button>
          <button class="btn btn-danger btn-xs" onclick="eliminarProyecto(${p.id_proyecto || p.id})">🗑 Eliminar</button>
        </td>
      </tr>`;
    }).join('');
}

window.eliminarProyecto = async function (id) {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
        const res = await apiFetch(`/proyectos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast('Proyecto eliminado');
            adminState.proyectos = adminState.proyectos.filter(p => (p.id_proyecto || p.id) !== id);
            renderProyectos(adminState.proyectos);
            updateKPIs();
            buildAdminChart();
        } else {
            toast('Error al eliminar', 'err');
        }
    } catch { toast('Error de red', 'err'); }
};

/* ══════════════════════════════════════════════════
   TABLA EVALUACIONES
══════════════════════════════════════════════════ */
function renderEvaluaciones(list) {
    const tbody = document.getElementById('evaluaciones-body');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">No hay evaluaciones.</td></tr>`;
        return;
    }

    const calColor = (v) => {
        if (v === null || v === undefined) return '#6b7280';
        const n = parseFloat(v);
        if (n >= 8) return '#22c55e';
        if (n >= 6) return '#38bdf8';
        return '#ef4444';
    };

    tbody.innerHTML = list.map(e => `
    <tr style="border-bottom:1px solid var(--border)"
        onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
      <td style="padding:12px;font-size:.85rem;font-weight:600">${e.estudiante_nombre || e.id_estudiante || '—'}</td>
      <td style="padding:12px;font-size:.82rem;color:var(--muted)">${e.proyecto_nombre || e.titulo || '—'}</td>
      <td style="padding:12px">
        <span style="font-family:var(--font-display);font-size:1rem;font-weight:800;color:${calColor(e.calificacion)}">
          ${e.tipo === 'falla' ? '🚫' : (e.calificacion ?? '—')}
        </span>
        <span style="font-size:.72rem;color:var(--muted);margin-left:4px">${e.tipo || ''}</span>
      </td>
      <td style="padding:12px;font-size:.82rem;color:var(--muted)">${e.docente_nombre || '—'}</td>
      <td style="padding:12px">
        <button class="btn btn-danger btn-xs" onclick="eliminarEvaluacion(${e.id_evaluacion || e.id})">🗑</button>
      </td>
    </tr>`).join('');
}

window.eliminarEvaluacion = async function(id) {
    if (!confirm('¿Eliminar este registro de calificación?')) return;
    try {
        const res = await apiFetch(`/evaluaciones/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast('Evaluación eliminada');
            adminState.evaluaciones = adminState.evaluaciones.filter(e => (e.id_evaluacion || e.id) !== id);
            renderEvaluaciones(adminState.evaluaciones);
            updateKPIs();
        } else {
            toast('Error al eliminar', 'err');
        }
    } catch { toast('Error de red', 'err'); }
};

/* ══════════════════════════════════════════════════
   NOTICIAS
══════════════════════════════════════════════════ */
function renderNoticias(list) {
    const container = document.getElementById('noticias-list');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--muted)">No hay noticias publicadas.</div>`;
        return;
    }

    const catLabel = { academico: '📅 Académico', taller: '🛠 Taller', infra: '🏗 Infra', logro: '🏆 Logro' };

    container.innerHTML = list.map(n => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;
         padding:1rem;transition:box-shadow .18s" 
         onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'"
         onmouseout="this.style.boxShadow=''">
      ${n.imagen_url ? `<img src="${n.imagen_url}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:.6rem">` : ''}
      <div style="font-size:.68rem;font-weight:700;color:var(--brand-green,#22c55e);margin-bottom:.35rem">
        ${n.emoji || ''} ${catLabel[n.categoria] || n.categoria || 'General'}
      </div>
      <div style="font-family:var(--font-display);font-weight:700;font-size:.9rem;margin-bottom:.35rem">${n.titulo}</div>
      <div style="font-size:.78rem;color:var(--muted);line-height:1.6;margin-bottom:.6rem">
        ${n.contenido?.substring(0, 120)}${n.contenido?.length > 120 ? '…' : ''}
      </div>
      <div style="display:flex;gap:.4rem;justify-content:flex-end">
        <button class="btn btn-ghost btn-xs" onclick="editarNoticia(${n.id})">✏️</button>
        <button class="btn btn-danger btn-xs" onclick="eliminarNoticia(${n.id})">🗑</button>
      </div>
    </div>`).join('');
}

window.editarNoticia = function (id) {
    const n = adminState.noticias.find(x => x.id === id);
    if (!n) return;
    const modal = document.getElementById('modal-noticia');
    if (!modal) return;
    modal.dataset.editId = id;
    document.getElementById('nn-titulo') && (document.getElementById('nn-titulo').value = n.titulo || '');
    document.getElementById('nn-contenido') && (document.getElementById('nn-contenido').value = n.contenido || '');
    document.querySelector('#modal-noticia .modal-title') &&
        (document.querySelector('#modal-noticia .modal-title').textContent = 'Editar noticia');
    modal.classList.remove('hidden');
};

window.eliminarNoticia = async function (id) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try {
        const res = await apiFetch(`/noticias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast('Noticia eliminada');
            adminState.noticias = adminState.noticias.filter(n => n.id !== id);
            renderNoticias(adminState.noticias);
            updateKPIs();
            buildAdminChart();
        } else {
            toast('Error al eliminar', 'err');
        }
    } catch { toast('Error de red', 'err'); }
};

/* ══════════════════════════════════════════════════
   REPORTES
══════════════════════════════════════════════════ */
window.generarReporte = async function (tipo) {
    const url = `${API}/reportes/${tipo}.pdf`;
    toast(`Generando reporte de ${tipo}…`);
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token()}` } });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_${tipo}.pdf`;
        link.click();
        toast('PDF descargado ✓');
    } catch {
        toast('Error al generar el PDF', 'err');
    }
};

/* ══════════════════════════════════════════════════
   MODALES
══════════════════════════════════════════════════ */
function setupModales() {
    // ─ Modal crear usuario ─
    const btnNuevoUsr = document.getElementById('btn-nuevo-usuario');
    const modalNuevoUsr = crearModalUsuario();

    btnNuevoUsr?.addEventListener('click', () => {
        modalNuevoUsr.querySelector('#nu-nombre') && (modalNuevoUsr.querySelector('#nu-nombre').value = '');
        modalNuevoUsr.querySelector('#nu-apellido') && (modalNuevoUsr.querySelector('#nu-apellido').value = '');
        modalNuevoUsr.querySelector('#nu-email') && (modalNuevoUsr.querySelector('#nu-email').value = '');
        const passBox = modalNuevoUsr.querySelector('.nu-pass-box');
        const form = modalNuevoUsr.querySelector('.nu-form');
        if (passBox) passBox.style.display = 'none';
        if (form) form.style.display = '';
        modalNuevoUsr.classList.remove('hidden');
    });

    // ─ Modal noticia (ya existe en HTML) ─
    const btnNoticia = document.getElementById('btn-nueva-noticia');
    const modalNoticia = document.getElementById('modal-noticia');

    btnNoticia?.addEventListener('click', () => {
        if (modalNoticia) {
            delete modalNoticia.dataset.editId;
            const titulo = modalNoticia.querySelector('#nn-titulo');
            const cont = modalNoticia.querySelector('#nn-contenido');
            if (titulo) titulo.value = '';
            if (cont) cont.value = '';
            const t = modalNoticia.querySelector('.modal-title');
            if (t) t.textContent = 'Nueva Noticia';
            modalNoticia.classList.remove('hidden');
        }
    });

    // Publicar / editar noticia
    const btnPublicar = modalNoticia?.querySelector('[onclick="crearNoticia()"]') ||
        modalNoticia?.querySelector('.btn-primary');
    btnPublicar?.removeAttribute('onclick');
    btnPublicar?.addEventListener('click', publicarNoticia);

    // ─ Modal crear proyecto ─
    const btnNuevoProy = document.getElementById('btn-nuevo-proyecto');
    btnNuevoProy?.addEventListener('click', () => {
        const modal = crearModalProyecto();
        modal.classList.remove('hidden');
    });

    // Cerrar modales
    document.querySelectorAll('.close-modal, [data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) modal.classList.add('hidden');
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });
}

/* ── Crear modal usuario dinámicamente ── */
function crearModalUsuario() {
    let modal = document.getElementById('modal-nuevo-usuario');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modal-nuevo-usuario';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <span class="modal-title">Crear usuario</span>
        <button class="modal-close close-modal">✕</button>
      </div>
      <div id="nu-msg" class="form-msg" role="alert"></div>

      <div class="nu-form">
        <div class="frow">
          <div class="fld"><label>Nombre</label><input id="nu-nombre" type="text" placeholder="Nombre(s)" /></div>
          <div class="fld"><label>Apellido</label><input id="nu-apellido" type="text" placeholder="Apellido(s)" /></div>
        </div>
        <div class="fld"><label>Correo electrónico</label><input id="nu-email" type="email" placeholder="correo@konradlorenz.edu.co" /></div>
        <div class="frow">
          <div class="fld">
            <label>Documento de Identidad</label>
            <input id="nu-documento" type="text" placeholder="Ej: 1000555..." />
          </div>
          <div class="fld">
            <label>Rol</label>
            <select id="nu-rol">
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost btn-sm close-modal">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="nu-crear-btn">Crear cuenta</button>
        </div>
      </div>

      <div class="nu-pass-box" style="display:none;background:var(--success-bg,#f0fdf4);border:1px solid #bbf7d0;
           border-radius:10px;padding:1rem;text-align:center;margin-top:.5rem">
        <div style="font-family:var(--font-display);font-size:.8rem;font-weight:600;color:#22c55e;margin-bottom:.5rem">
          ✅ Usuario creado. Contraseña inicial (Documento):
        </div>
        <div id="nu-pass-val" style="font-family:'Courier New',monospace;font-size:1.4rem;font-weight:700;color:#22c55e;
             background:var(--surface,#fff);border:1px solid #bbf7d0;border-radius:8px;padding:.5rem 1rem;
             margin-bottom:.5rem;letter-spacing:.1em"></div>
        <div style="font-size:.72rem;color:var(--muted);margin-bottom:.75rem;line-height:1.6">
          El usuario podrá ingresar con su número de documento.
        </div>
        <button class="btn btn-primary btn-sm w-full close-modal" onclick="recargarUsuarios()">Aceptar y cerrar</button>
      </div>
    </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#nu-crear-btn')?.addEventListener('click', async () => {
        const nombre = modal.querySelector('#nu-nombre')?.value.trim();
        const apellido = modal.querySelector('#nu-apellido')?.value.trim();
        const email = modal.querySelector('#nu-email')?.value.trim();
        const documento = modal.querySelector('#nu-documento')?.value.trim();
        const rol = modal.querySelector('#nu-rol')?.value;
        const msg = modal.querySelector('#nu-msg');

        if (!nombre || !email || !documento) { showMsg(msg, 'Nombre, correo y documento son obligatorios', 'err'); return; }

        try {
            const res = await apiFetch('/auth/registro', {
                method: 'POST',
                body: JSON.stringify({ nombre, apellido, email, documento, rol }),
            });
            const data = await res.json();
            if (res.ok) {
                const passBox = modal.querySelector('.nu-pass-box');
                const form = modal.querySelector('.nu-form');
                const passVal = modal.querySelector('#nu-pass-val');
                if (form) form.style.display = 'none';
                if (passBox) passBox.style.display = '';
                if (passVal) passVal.textContent = documento;

                const nuevoUser = { id: data.id, nombre, apellido, email, documento, rol, estado: 'activo' };
                adminState.usuarios.push(nuevoUser);
                updateKPIs();
                buildAdminChart();
            } else {
                showMsg(msg, data.mensaje || data.error || 'Error al crear usuario', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });

    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    return modal;
}

function crearModalUsuarioEdit() {
    let modal = document.getElementById('modal-usuario-edit');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modal-usuario-edit';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <span class="modal-title">Editar usuario</span>
        <button class="modal-close close-modal">✕</button>
      </div>
      <div id="eu-msg" class="form-msg" role="alert"></div>
      <input type="hidden" id="eu-id" />
      <div class="frow">
        <div class="fld"><label>Nombre</label><input id="eu-nombre" type="text" /></div>
        <div class="fld"><label>Apellido</label><input id="eu-apellido" type="text" /></div>
      </div>
      <div class="fld"><label>Correo</label><input id="eu-email" type="email" /></div>
      <div class="frow">
        <div class="fld"><label>Documento</label><input id="eu-documento" type="text" /></div>
        <div class="fld">
          <label>Rol</label>
          <select id="eu-rol">
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost btn-sm close-modal">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="eu-guardar-btn">Guardar cambios</button>
      </div>
    </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#eu-guardar-btn')?.addEventListener('click', async () => {
        const id = modal.querySelector('#eu-id').value;
        const payload = {
            nombre: modal.querySelector('#eu-nombre').value.trim(),
            apellido: modal.querySelector('#eu-apellido').value.trim(),
            email: modal.querySelector('#eu-email').value.trim(),
            documento: modal.querySelector('#eu-documento').value.trim(),
            rol: modal.querySelector('#eu-rol').value,
        };
        const msg = modal.querySelector('#eu-msg');

        try {
            const res = await apiFetch(`/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast('Usuario actualizado');
                modal.classList.add('hidden');
                // Actualizar estado local
                const idx = adminState.usuarios.findIndex(x => (x.id_usuario || x.id) == id);
                if (idx !== -1) adminState.usuarios[idx] = { ...adminState.usuarios[idx], ...payload };
                renderUsuarios(adminState.usuarios);
            } else {
                const data = await res.json();
                showMsg(msg, data.message || 'Error al actualizar', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });

    return modal;
}

window.recargarUsuarios = function () {
    // Activar sección usuarios y re-renderizar
    document.querySelector('.nav-item[data-sec="usuarios"]')?.click();
};

/* ── Publicar / editar noticia ── */
async function publicarNoticia() {
    const modal = document.getElementById('modal-noticia');
    const titulo = document.getElementById('nn-titulo')?.value.trim();
    const cont = document.getElementById('nn-contenido')?.value.trim();
    const editId = modal?.dataset.editId;

    if (!titulo || !cont) { toast('Completa todos los campos', 'err'); return; }

    try {
        const method = editId ? 'PUT' : 'POST';
        const endpoint = editId ? `/noticias/${editId}` : '/noticias';
        const res = await apiFetch(endpoint, {
            method,
            body: JSON.stringify({ titulo, contenido: cont }),
        });
        if (res.ok) {
            const data = await res.json();
            toast(editId ? 'Noticia actualizada ✓' : 'Noticia publicada ✓');
            modal?.classList.add('hidden');
            // Refrescar
            const rN = await apiFetch('/noticias');
            if (rN.ok) { const d = await rN.json(); adminState.noticias = d.data || d.noticias || d; }
            renderNoticias(adminState.noticias);
            updateKPIs();
            buildAdminChart();
        } else {
            toast('Error al guardar la noticia', 'err');
        }
    } catch { toast('Error de red', 'err'); }
}

/* ══════════════════════════════════════════════════
   UTILIDADES DE FORMULARIOS
══════════════════════════════════════════════════ */
function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `form-msg show msg-${type}`;
    setTimeout(() => { if (el) { el.className = 'form-msg'; el.textContent = ''; } }, 4000);
}

/* Exponer cerrarModal y openModal globalmente (compatibilidad con botones en HTML) */
window.cerrarModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
};

window.openModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
};

function crearModalProyecto() {
    let modal = document.getElementById('modal-proyecto');
    if (modal) {
        // Refrescar lista de docentes cada vez que se abre
        const select = modal.querySelector('#ep-docente');
        if (select) {
            const docentes = adminState.usuarios.filter(u => u.rol === 'docente');
            select.innerHTML = docentes.map(d => `<option value="${d.id_usuario || d.id}">${d.nombre} ${d.apellido || ''}</option>`).join('');
        }
        return modal;
    }

    modal = document.createElement('div');
    modal.id = 'modal-proyecto';
    modal.className = 'modal-overlay hidden';
    
    const docentes = adminState.usuarios.filter(u => u.rol === 'docente');
    const docenteOpts = docentes.map(d => `<option value="${d.id_usuario || d.id}">${d.nombre} ${d.apellido || ''}</option>`).join('');

    modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <span class="modal-title">Gestión de Proyecto</span>
        <button class="modal-close close-modal">✕</button>
      </div>
      <div id="ep-msg" class="form-msg" role="alert"></div>
      <input type="hidden" id="ep-id" />
      <div class="fld"><label>Título del Proyecto</label><input id="ep-titulo" type="text" /></div>
      <div class="fld"><label>Descripción</label><textarea id="ep-desc" rows="3"></textarea></div>
      <div class="frow">
        <div class="fld"><label>Docente Responsable</label><select id="ep-docente">${docenteOpts}</select></div>
        <div class="fld">
          <label>Estado</label>
          <select id="ep-estado">
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
      </div>
      <div class="frow">
        <div class="fld"><label>Fecha Inicio</label><input id="ep-inicio" type="date" /></div>
        <div class="fld"><label>Fecha Límite</label><input id="ep-limite" type="date" /></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost btn-sm close-modal">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="ep-guardar-btn">Guardar Proyecto</button>
      </div>
    </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#ep-guardar-btn')?.addEventListener('click', async () => {
        const id = modal.querySelector('#ep-id').value;
        const payload = {
            titulo: modal.querySelector('#ep-titulo').value.trim(),
            descripcion: modal.querySelector('#ep-desc').value.trim(),
            id_docente: modal.querySelector('#ep-docente').value,
            estado: modal.querySelector('#ep-estado').value,
            fecha_inicio: modal.querySelector('#ep-inicio').value,
            fecha_limite: modal.querySelector('#ep-limite').value,
        };
        const msg = modal.querySelector('#ep-msg');

        if (!payload.titulo || !payload.id_docente || !payload.fecha_limite) {
            showMsg(msg, 'Título, docente y fecha límite son obligatorios', 'err');
            return;
        }

        try {
            const method = id ? 'PUT' : 'POST';
            const endpoint = id ? `/proyectos/${id}` : '/proyectos';
            const res = await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
            
            if (res.ok) {
                toast(id ? 'Proyecto actualizado' : 'Proyecto creado');
                modal.classList.add('hidden');
                loadAllData();
            } else {
                const data = await res.json();
                showMsg(msg, data.message || 'Error al guardar', 'err');
            }
        } catch { showMsg(msg, 'Error de red', 'err'); }
    });

    // Cerrar modal al hacer clic en overlay
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    // Botones de cierre
    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.classList.add('hidden')));

    return modal;
}

window.editarProyecto = function(id) {
    const p = adminState.proyectos.find(x => (x.id_proyecto || x.id) == id);
    if (!p) return;
    const modal = crearModalProyecto();
    
    document.getElementById('ep-id').value = id;
    document.getElementById('ep-titulo').value = p.titulo || p.nombre || '';
    document.getElementById('ep-desc').value = p.descripcion || '';
    document.getElementById('ep-docente').value = p.id_docente || '';
    document.getElementById('ep-estado').value = p.estado || 'activo';
    document.getElementById('ep-inicio').value = p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '';
    document.getElementById('ep-limite').value = p.fecha_limite ? p.fecha_limite.split('T')[0] : '';
    
    modal.querySelector('.modal-title').textContent = 'Editar Proyecto';
    modal.classList.remove('hidden');
};

/* ══════════════════════════════════════════════════
   REPORTES Y UTILIDADES ADICIONALES
   ══════════════════════════════════════════════════ */
window.generarReporte = async function (tipo) {
    toast(`Generando reporte de ${tipo}...`);
    try {
        const res = await fetch(`${API}/reportes/pdf/${tipo}`, {
            headers: { 'Authorization': `Bearer ${token()}` }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } else {
            const data = await res.json();
            toast(data.message || 'Error al generar PDF', 'err');
        }
    } catch (e) { 
        console.error(e);
        toast('Error de red al descargar reporte', 'err'); 
    }
};

window.cerrarModal = function (id) {
    document.getElementById(id)?.classList.add('hidden');
};

window.recargarUsuarios = function () {
    loadAllData();
    const modal = document.getElementById('modal-nuevo-usuario');
    if (modal) {
        modal.classList.add('hidden');
        // Resetear vista para la próxima vez
        const form = modal.querySelector('.nu-form');
        const passBox = modal.querySelector('.nu-pass-box');
        if (form) form.style.display = '';
        if (passBox) passBox.style.display = 'none';
    }
};

window.crearNoticia = async function () {
    const titulo = document.getElementById('nn-titulo').value.trim();
    const contenido = document.getElementById('nn-contenido').value.trim();
    const categoria = document.getElementById('nn-categoria')?.value || 'academico';

    if (!titulo || !contenido) return toast('Título y contenido son obligatorios', 'err');

    try {
        const res = await apiFetch('/noticias', {
            method: 'POST',
            body: JSON.stringify({ titulo, contenido, categoria })
        });
        if (res.ok) {
            toast('Noticia publicada');
            cerrarModal('modal-noticia');
            // Limpiar campos
            document.getElementById('nn-titulo').value = '';
            document.getElementById('nn-contenido').value = '';
            loadAllData();
        } else {
            toast('Error al publicar noticia', 'err');
        }
    } catch { toast('Error de red', 'err'); }
};
/* === CODEX REAL ADMIN OVERRIDES === */
adminState.currentUser = null;
adminState.perfil = null;

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

function normalizeArray(payload, key) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    return [];
}

function userId(row) { return Number(row.id_usuario || row.id || 0); }
function rowId(row) { return Number(row.id || row.id_proyecto || row.id_evaluacion || 0); }
function fullName(u) { return `${u?.nombre || ''} ${u?.apellido || ''}`.trim() || u?.email || 'Usuario'; }
function activeLabel(u) { return u?.activo === false || u?.activo === 0 ? 'inactivo' : 'activo'; }
function projectProgress(p) { return Math.max(0, Math.min(100, Number(p.avance_pct ?? p.avance ?? 0) || 0)); }

async function readJson(res) {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

async function apiJson(endpoint, opts = {}) {
    const res = await apiFetch(endpoint, opts);
    const data = await readJson(res);
    if (!res.ok || data.ok === false) throw new Error(data.mensaje || data.message || data.error || 'La operación no se pudo completar.');
    return data;
}

async function fileToDataUrl(file) {
    if (!file) return null;
    if (file.size > 900 * 1024) throw new Error('La imagen debe pesar menos de 900 KB.');
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
    });
}

function setAvatar(src) {
    const fallback = '../img/user-avatar.png';
    ['sb-avatar-img', 'prof-av-img'].forEach(id => {
        const img = document.getElementById(id);
        if (!img) return;
        img.src = src || fallback;
        img.onerror = () => { img.src = fallback; };
    });
}

async function loadCurrentAdmin() {
    const me = await apiJson('/auth/me');
    adminState.currentUser = me.data || me.usuario || me;

    try {
        const perfilResp = await apiJson('/perfil');
        const base = perfilResp.data || perfilResp;
        adminState.perfil = { ...base, ...(base.perfil || {}) };
    } catch {
        adminState.perfil = {};
    }

    const user = { ...adminState.currentUser, ...adminState.perfil };
    const name = fullName(user);
    const role = user.rol || 'admin';
    const roleText = { admin: 'Administrador', docente: 'Docente', estudiante: 'Estudiante' }[role] || role;

    document.getElementById('sb-uname') && (document.getElementById('sb-uname').textContent = name);
    document.getElementById('sb-email') && (document.getElementById('sb-email').textContent = user.email || '—');
    document.getElementById('prof-name') && (document.getElementById('prof-name').textContent = name);
    document.getElementById('prof-sub') && (document.getElementById('prof-sub').textContent = user.email || roleText);
    document.getElementById('pm-rol') && (document.getElementById('pm-rol').textContent = roleText);
    setAvatar(user.avatar_url);
    renderPerfilDatos(user);
    fillPerfilForm(user);
}

function renderPerfilDatos(p = {}) {
    const datos = document.getElementById('perfil-datos');
    if (!datos) return;
    datos.innerHTML = [
        ['Nacimiento', formatDate(p.fecha_nacimiento)],
        ['Ciudad', p.ciudad || '—'],
        ['Teléfono', p.telefono || '—'],
        ['Correo', p.email || '—'],
        ['Rol', ({ admin: 'Administrador', docente: 'Docente', estudiante: 'Estudiante' }[p.rol] || p.rol || '—')],
    ].map(([label, value]) => `
        <div>
          <div class="pdl">${escapeHTML(label)}</div>
          <div class="pdv">${escapeHTML(value)}</div>
        </div>`).join('');
}

function fillPerfilForm(p = {}) {
    const values = {
        'ep-nacimiento': p.fecha_nacimiento ? String(p.fecha_nacimiento).split('T')[0] : '',
        'ep-ciudad': p.ciudad || '',
        'ep-telefono': p.telefono || '',
    };
    Object.entries(values).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    });
}

function setupPerfil() {
    document.getElementById('btn-editar-perfil')?.addEventListener('click', () => {
        document.getElementById('perfil-view')?.classList.add('hidden');
        document.getElementById('perfil-edit')?.classList.remove('hidden');
    });

    document.getElementById('cancel-edit-perfil')?.addEventListener('click', () => {
        document.getElementById('perfil-view')?.classList.remove('hidden');
        document.getElementById('perfil-edit')?.classList.add('hidden');
    });

    document.getElementById('ep-avatar')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try { setAvatar(await fileToDataUrl(file)); }
        catch (err) { toast(err.message, 'err'); event.target.value = ''; }
    });

    document.getElementById('guardar-perfil-btn')?.addEventListener('click', async () => {
        const msg = document.getElementById('msg-perfil');
        try {
            const avatarFile = document.getElementById('ep-avatar')?.files?.[0];
            const avatar_url = avatarFile ? await fileToDataUrl(avatarFile) : undefined;
            const payload = {
                fecha_nacimiento: document.getElementById('ep-nacimiento')?.value || null,
                ciudad: document.getElementById('ep-ciudad')?.value || null,
                telefono: document.getElementById('ep-telefono')?.value || null,
                avatar_url,
            };
            const saved = await apiJson('/perfil', { method: 'PUT', body: JSON.stringify(payload) });
            showMsg(msg, saved.mensaje || 'Perfil actualizado correctamente.', 'ok');
            await loadCurrentAdmin();
            document.getElementById('perfil-view')?.classList.remove('hidden');
            document.getElementById('perfil-edit')?.classList.add('hidden');
            toast('Perfil actualizado');
        } catch (err) {
            showMsg(msg, err.message, 'err');
        }
    });
}

async function loadAllData() {
    try {
        await loadCurrentAdmin();
        const [usuarios, proyectos, evaluaciones, noticias] = await Promise.all([
            apiJson('/usuarios'), apiJson('/proyectos'), apiJson('/evaluaciones'), apiJson('/noticias'),
        ]);
        adminState.usuarios = normalizeArray(usuarios, 'usuarios');
        adminState.proyectos = normalizeArray(proyectos, 'proyectos');
        adminState.evaluaciones = normalizeArray(evaluaciones, 'notas');
        adminState.noticias = normalizeArray(noticias, 'noticias');
    } catch (err) {
        toast(err.message || 'No se pudieron cargar los datos.', 'err');
    }

    updateKPIs();
    buildAdminChart();
    document.getElementById('pm-usuarios') && (document.getElementById('pm-usuarios').textContent = adminState.usuarios.length);
    document.getElementById('pm-proyectos-act') && (document.getElementById('pm-proyectos-act').textContent = adminState.proyectos.filter(p => p.estado === 'activo').length);
    renderActiveSection();
}

function renderActiveSection() {
    const active = document.querySelector('.sec.active')?.id;
    if (active === 'sec-usuarios') renderUsuarios(adminState.usuarios);
    if (active === 'sec-proyectos') renderProyectos(adminState.proyectos);
    if (active === 'sec-evaluaciones') renderEvaluaciones(adminState.evaluaciones);
    if (active === 'sec-noticias') renderNoticias(adminState.noticias);
}

function renderUsuarios(list) {
    const tbody = document.getElementById('usuarios-body');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--muted)">No hay usuarios registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(u => {
        const id = userId(u);
        const status = activeLabel(u);
        return `
        <tr>
          <td style="padding:12px"><strong>${escapeHTML(fullName(u))}</strong></td>
          <td style="padding:12px;color:var(--muted)">${escapeHTML(u.email || '—')}</td>
          <td style="padding:12px;font-family:monospace">${escapeHTML(u.documento || '—')}</td>
          <td style="padding:12px">${badge(u.rol || 'estudiante')}</td>
          <td style="padding:12px">${badge(status)}</td>
          <td style="padding:12px;display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-xs" onclick="editarUsuario(${id})">Editar</button>
            <button class="btn btn-danger btn-xs" onclick="eliminarUsuario(${id})">${status === 'activo' ? 'Desactivar' : 'Eliminar'}</button>
          </td>
        </tr>`;
    }).join('');
}

function renderProyectos(list) {
    const tbody = document.getElementById('proyectos-body');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--muted)">No hay proyectos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(p => {
        const id = rowId(p);
        const avance = projectProgress(p);
        return `
        <tr>
          <td style="padding:12px;font-weight:700">${escapeHTML(p.titulo || p.nombre || 'Proyecto')}</td>
          <td style="padding:12px;color:var(--muted)">${escapeHTML(p.lider_nombre || p.docente || p.creador || '—')}</td>
          <td style="padding:12px">${badge(p.estado || 'activo')}</td>
          <td style="padding:12px;min-width:140px">
            <div style="height:6px;background:var(--bg2);border-radius:999px;overflow:hidden"><div style="height:100%;width:${avance}%;background:#22c55e"></div></div>
            <span style="font-size:.72rem;color:var(--muted)">${avance}%</span>
          </td>
          <td style="padding:12px;display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-xs" onclick="editarProyecto(${id})">Editar</button>
            <button class="btn btn-danger btn-xs" onclick="eliminarProyecto(${id})">Eliminar</button>
          </td>
        </tr>`;
    }).join('');
}

function renderEvaluaciones(list) {
    const tbody = document.getElementById('evaluaciones-body');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--muted)">No hay evaluaciones registradas.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(e => {
        const id = rowId(e);
        return `
        <tr>
          <td style="padding:12px;font-weight:700">${escapeHTML(e.estudiante || e.estudiante_nombre || e.id_estudiante || '—')}</td>
          <td style="padding:12px;color:var(--muted)">${escapeHTML(e.proyecto || e.proyecto_nombre || e.titulo || '—')}</td>
          <td style="padding:12px"><strong>${escapeHTML(e.tipo === 'falla' ? 'Falla' : (e.calificacion ?? '—'))}</strong> <span style="color:var(--muted)">${escapeHTML(e.tipo || '')}</span></td>
          <td style="padding:12px;color:var(--muted)">${escapeHTML(e.docente || e.docente_nombre || '—')}</td>
          <td style="padding:12px"><button class="btn btn-danger btn-xs" onclick="eliminarEvaluacion(${id})">Eliminar</button></td>
        </tr>`;
    }).join('');
}

function renderNoticias(list) {
    const container = document.getElementById('noticias-list');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--muted)">No hay noticias publicadas.</div>`;
        return;
    }
    const catLabel = { academico: 'Académico', taller: 'Taller', infra: 'Infraestructura', logro: 'Logro' };
    container.innerHTML = list.map(n => {
        const id = rowId(n);
        const body = n.contenido || n.descripcion || '';
        return `
        <article style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem">
          ${n.imagen_url ? `<img src="${escapeHTML(n.imagen_url)}" alt="${escapeHTML(n.titulo || 'Noticia')}" style="width:100%;height:130px;object-fit:cover;border-radius:6px;margin-bottom:.75rem">` : ''}
          <div style="font-size:.7rem;font-weight:800;color:var(--brand-green);margin-bottom:.35rem">${escapeHTML(catLabel[n.categoria] || n.categoria || 'General')}</div>
          <h3 style="font-size:1rem;margin:0 0 .4rem">${escapeHTML(n.titulo || 'Noticia')}</h3>
          <p style="font-size:.82rem;color:var(--muted);line-height:1.55;margin:0 0 .75rem">${escapeHTML(body.substring(0, 150))}${body.length > 150 ? '…' : ''}</p>
          <div style="display:flex;gap:.4rem;justify-content:flex-end"><button class="btn btn-ghost btn-xs" onclick="editarNoticia(${id})">Editar</button><button class="btn btn-danger btn-xs" onclick="eliminarNoticia(${id})">Eliminar</button></div>
        </article>`;
    }).join('');
}

function setupModales() {
    crearModalUsuario();
    document.getElementById('btn-nuevo-usuario')?.addEventListener('click', () => openUsuarioCreate());
    document.getElementById('btn-nuevo-proyecto')?.addEventListener('click', () => openProyectoCreate());

    const modalNoticia = document.getElementById('modal-noticia');
    document.getElementById('btn-nueva-noticia')?.addEventListener('click', () => openNoticiaCreate());
    const btnPublicar = modalNoticia?.querySelector('[onclick="crearNoticia()"]') || modalNoticia?.querySelector('.btn-primary');
    btnPublicar?.removeAttribute('onclick');
    btnPublicar?.addEventListener('click', guardarNoticia);

    document.querySelectorAll('.close-modal, [data-close-modal]').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.add('hidden')));
    document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); }));
}

function openUsuarioCreate() {
    const modal = crearModalUsuario();
    modal.dataset.mode = 'create';
    modal.querySelector('.modal-title').textContent = 'Crear usuario';
    ['nu-nombre','nu-apellido','nu-email','nu-documento'].forEach(id => { const el = modal.querySelector(`#${id}`); if (el) el.value = ''; });
    modal.querySelector('#nu-rol').value = 'estudiante';
    modal.querySelector('.nu-form').style.display = '';
    modal.querySelector('.nu-pass-box').style.display = 'none';
    modal.classList.remove('hidden');
}

function crearModalUsuario() {
    let modal = document.getElementById('modal-nuevo-usuario');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'modal-nuevo-usuario';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head"><span class="modal-title">Crear usuario</span><button class="modal-close close-modal">×</button></div>
      <div id="nu-msg" class="form-msg" role="alert"></div>
      <div class="nu-form">
        <div class="frow"><div class="fld"><label>Nombre</label><input id="nu-nombre" type="text"></div><div class="fld"><label>Apellido</label><input id="nu-apellido" type="text"></div></div>
        <div class="fld"><label>Correo electrónico</label><input id="nu-email" type="email"></div>
        <div class="frow"><div class="fld"><label>Documento</label><input id="nu-documento" type="text"></div><div class="fld"><label>Rol</label><select id="nu-rol"><option value="estudiante">Estudiante</option><option value="docente">Docente</option><option value="admin">Administrador</option></select></div></div>
        <div class="modal-actions"><button class="btn btn-ghost btn-sm close-modal">Cancelar</button><button class="btn btn-primary btn-sm" id="nu-crear-btn">Guardar</button></div>
      </div>
      <div class="nu-pass-box hidden" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-top:.75rem"><div class="tpb-label">Usuario creado. Contraseña temporal:</div><div id="nu-pass-val" style="font-family:monospace;font-size:1.2rem;font-weight:800;margin:.5rem 0"></div><button class="btn btn-primary btn-sm w-full" id="nu-close-created">Aceptar</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#nu-crear-btn').addEventListener('click', guardarUsuarioModal);
    modal.querySelector('#nu-close-created').addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => modal.classList.add('hidden')));
    return modal;
}

async function guardarUsuarioModal() {
    const modal = document.getElementById('modal-nuevo-usuario');
    const id = modal.dataset.editId;
    const msg = modal.querySelector('#nu-msg');
    const payload = {
        nombre: modal.querySelector('#nu-nombre').value.trim(),
        apellido: modal.querySelector('#nu-apellido').value.trim(),
        email: modal.querySelector('#nu-email').value.trim(),
        documento: modal.querySelector('#nu-documento').value.trim(),
        rol: modal.querySelector('#nu-rol').value,
    };
    if (!payload.nombre || !payload.email || !payload.documento) return showMsg(msg, 'Nombre, correo y documento son obligatorios.', 'err');
    try {
        const data = id
            ? await apiJson(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
            : await apiJson('/auth/registro', { method: 'POST', body: JSON.stringify(payload) });
        await loadAllData();
        if (id) {
            modal.classList.add('hidden');
            toast('Usuario actualizado');
        } else {
            modal.querySelector('.nu-form').style.display = 'none';
            modal.querySelector('.nu-pass-box').classList.remove('hidden');
            modal.querySelector('#nu-pass-val').textContent = data.contrasena_temporal || payload.documento;
            toast('Usuario creado');
        }
    } catch (err) { showMsg(msg, err.message, 'err'); }
}

window.editarUsuario = function(id) {
    const u = adminState.usuarios.find(x => userId(x) === Number(id));
    if (!u) return;
    const modal = crearModalUsuario();
    modal.dataset.mode = 'edit';
    modal.dataset.editId = String(id);
    modal.querySelector('.modal-title').textContent = 'Editar usuario';
    modal.querySelector('#nu-nombre').value = u.nombre || '';
    modal.querySelector('#nu-apellido').value = u.apellido || '';
    modal.querySelector('#nu-email').value = u.email || '';
    modal.querySelector('#nu-documento').value = u.documento || '';
    modal.querySelector('#nu-rol').value = u.rol || 'estudiante';
    modal.querySelector('.nu-form').style.display = '';
    modal.querySelector('.nu-pass-box').classList.add('hidden');
    modal.classList.remove('hidden');
};

window.eliminarUsuario = async function(id) {
    const u = adminState.usuarios.find(x => userId(x) === Number(id));
    const action = activeLabel(u) === 'activo' ? 'desactivar' : 'eliminar';
    if (!confirm(`¿Quieres ${action} este usuario?`)) return;
    try {
        await apiJson(`/usuarios/${id}`, { method: 'DELETE' });
        toast('Usuario desactivado');
        await loadAllData();
    } catch (err) { toast(err.message, 'err'); }
};

function openProyectoCreate() {
    const modal = crearModalProyecto();
    modal.dataset.mode = 'create';
    delete modal.dataset.editId;
    modal.querySelector('.modal-title').textContent = 'Crear proyecto';
    ['ep-id','ep-titulo','ep-desc','ep-inicio','ep-limite'].forEach(id => { const el = modal.querySelector(`#${id}`); if (el) el.value = ''; });
    modal.querySelector('#ep-estado').value = 'activo';
    modal.classList.remove('hidden');
}

function crearModalProyecto() {
    let modal = document.getElementById('modal-proyecto');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-proyecto';
        modal.className = 'modal-overlay hidden';
        modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-head"><span class="modal-title">Proyecto</span><button class="modal-close close-modal">×</button></div>
          <div id="ep-msg" class="form-msg" role="alert"></div><input type="hidden" id="ep-id">
          <div class="fld"><label>Título</label><input id="ep-titulo" type="text"></div>
          <div class="fld"><label>Descripción</label><textarea id="ep-desc" rows="3"></textarea></div>
          <div class="frow"><div class="fld"><label>Docente líder</label><select id="ep-docente"></select></div><div class="fld"><label>Estado</label><select id="ep-estado"><option value="activo">Activo</option><option value="pausado">Pausado</option><option value="finalizado">Finalizado</option></select></div></div>
          <div class="frow"><div class="fld"><label>Fecha inicio</label><input id="ep-inicio" type="date"></div><div class="fld"><label>Fecha límite</label><input id="ep-limite" type="date"></div></div>
          <div class="modal-actions"><button class="btn btn-ghost btn-sm close-modal">Cancelar</button><button class="btn btn-primary btn-sm" id="ep-guardar-btn">Guardar</button></div>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector('#ep-guardar-btn').addEventListener('click', guardarProyectoModal);
        modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => modal.classList.add('hidden')));
    }
    const docentes = adminState.usuarios.filter(u => u.rol === 'docente' || u.rol === 'admin');
    modal.querySelector('#ep-docente').innerHTML = docentes.map(d => `<option value="${userId(d)}">${escapeHTML(fullName(d))}</option>`).join('');
    return modal;
}

async function guardarProyectoModal() {
    const modal = document.getElementById('modal-proyecto');
    const id = modal.dataset.editId;
    const msg = modal.querySelector('#ep-msg');
    const payload = {
        titulo: modal.querySelector('#ep-titulo').value.trim(),
        descripcion: modal.querySelector('#ep-desc').value.trim(),
        id_docente: Number(modal.querySelector('#ep-docente').value),
        estado: modal.querySelector('#ep-estado').value,
        fecha_inicio: modal.querySelector('#ep-inicio').value,
        fecha_limite: modal.querySelector('#ep-limite').value,
    };
    if (!payload.titulo || !payload.fecha_inicio || !payload.fecha_limite || !payload.id_docente) return showMsg(msg, 'Título, docente y fechas son obligatorios.', 'err');
    try {
        await apiJson(id ? `/proyectos/${id}` : '/proyectos', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modal.classList.add('hidden');
        toast(id ? 'Proyecto actualizado' : 'Proyecto creado');
        await loadAllData();
    } catch (err) { showMsg(msg, err.message, 'err'); }
}

window.editarProyecto = function(id) {
    const p = adminState.proyectos.find(x => rowId(x) === Number(id));
    if (!p) return;
    const modal = crearModalProyecto();
    modal.dataset.mode = 'edit';
    modal.dataset.editId = String(id);
    modal.querySelector('.modal-title').textContent = 'Editar proyecto';
    modal.querySelector('#ep-titulo').value = p.titulo || p.nombre || '';
    modal.querySelector('#ep-desc').value = p.descripcion || '';
    modal.querySelector('#ep-docente').value = p.id_docente || '';
    modal.querySelector('#ep-estado').value = p.estado || 'activo';
    modal.querySelector('#ep-inicio').value = p.fecha_inicio ? String(p.fecha_inicio).split('T')[0] : '';
    modal.querySelector('#ep-limite').value = p.fecha_limite ? String(p.fecha_limite).split('T')[0] : '';
    modal.classList.remove('hidden');
};

window.eliminarProyecto = async function(id) {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try { await apiJson(`/proyectos/${id}`, { method: 'DELETE' }); toast('Proyecto eliminado'); await loadAllData(); }
    catch (err) { toast(err.message, 'err'); }
};

window.eliminarEvaluacion = async function(id) {
    if (!confirm('¿Eliminar esta evaluación?')) return;
    try { await apiJson(`/evaluaciones/${id}`, { method: 'DELETE' }); toast('Evaluación eliminada'); await loadAllData(); }
    catch (err) { toast(err.message, 'err'); }
};

function openNoticiaCreate() {
    const modal = document.getElementById('modal-noticia');
    if (!modal) return;
    delete modal.dataset.editId;
    modal.querySelector('.modal-title').textContent = 'Nueva noticia';
    ['nn-titulo','nn-contenido'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const cat = document.getElementById('nn-categoria'); if (cat) cat.value = 'academico';
    modal.classList.remove('hidden');
}

window.editarNoticia = function(id) {
    const n = adminState.noticias.find(x => rowId(x) === Number(id));
    if (!n) return;
    const modal = document.getElementById('modal-noticia');
    modal.dataset.editId = String(id);
    modal.querySelector('.modal-title').textContent = 'Editar noticia';
    document.getElementById('nn-titulo').value = n.titulo || '';
    document.getElementById('nn-contenido').value = n.contenido || n.descripcion || '';
    const cat = document.getElementById('nn-categoria'); if (cat) cat.value = n.categoria || 'academico';
    modal.classList.remove('hidden');
};

async function guardarNoticia() {
    const modal = document.getElementById('modal-noticia');
    const id = modal?.dataset.editId;
    const payload = {
        titulo: document.getElementById('nn-titulo').value.trim(),
        contenido: document.getElementById('nn-contenido').value.trim(),
        categoria: document.getElementById('nn-categoria')?.value || 'academico',
    };
    if (!payload.titulo || !payload.contenido) return toast('Título y contenido son obligatorios.', 'err');
    try {
        await apiJson(id ? `/noticias/${id}` : '/noticias', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modal.classList.add('hidden');
        toast(id ? 'Noticia actualizada' : 'Noticia publicada');
        await loadAllData();
    } catch (err) { toast(err.message, 'err'); }
}

window.eliminarNoticia = async function(id) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try { await apiJson(`/noticias/${id}`, { method: 'DELETE' }); toast('Noticia eliminada'); await loadAllData(); }
    catch (err) { toast(err.message, 'err'); }
};

window.crearNoticia = guardarNoticia;

window.generarReporte = async function(tipo) {
    toast(`Generando reporte de ${tipo}...`);
    try {
        const res = await fetch(`${API}/reportes/pdf/${tipo}`, { headers: { Authorization: `Bearer ${token()}` } });
        if (!res.ok) throw new Error('No se pudo generar el reporte.');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reporte_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        toast('Reporte descargado');
    } catch (err) { toast(err.message, 'err'); }
};