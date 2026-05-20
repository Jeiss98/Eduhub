import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit {
  usuario: any = null;
  stats: any = null;
  tareas: any[] = [];
  loading = true;
  activeSection = 'inicio';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private themeService: ThemeService
  ) { }

  toggleTheme() { this.themeService.toggleTheme(); }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.usuario = this.authService.getUser();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // PDF download handler
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-pdf-url]') as HTMLElement;
      if (btn) {
        const url = btn.getAttribute('data-pdf-url');
        if (url) this.descargarPDF(url, btn);
      }
    });
  }

  // ══ CARGA PRINCIPAL ══
  loadDashboardData() {
    this.loading = true;
    this.apiService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.ok) this.stats = res.data;
        this.loadTareas();
        this.loadProyectos();
        this.loadNotas();
        this.loadNoticias();
        this.loadUsuarios();
      },
      error: () => { this.loading = false; }
    });
  }

  // ══ TAREAS ══
  loadTareas() {
    this.apiService.getTareas().subscribe({
      next: (res) => {
        if (res.ok) this.tareas = (res.data || []).slice(0, 5);
        this.loading = false;
        this.renderTareasFull(res.data || []);
      },
      error: () => { this.loading = false; }
    });
  }

  renderTareasFull(tareas: any[]) {
    const el = document.getElementById('tasks-list');
    if (!el) return;
    if (tareas.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay tareas registradas.</div>';
      return;
    }
    const countEl = document.getElementById('tar-count');
    if (countEl) countEl.textContent = `${tareas.length} tareas en total`;

    el.innerHTML = tareas.map(t => `
      <div class="tf-row ${t.completada ? 'tf-done' : ''}">
        <div class="tf-check ${t.completada ? 'tf-checked' : ''}">
          ${t.completada ? '✓' : ''}
        </div>
        <div class="tf-body">
          <div class="tf-title ${t.completada ? 'done' : ''}">${t.titulo || '—'}</div>
          <div class="tf-meta">
            <span class="tf-course">${t.prioridad || 'media'}</span>
            ${t.fecha_limite ? `<span class="tf-due">📅 ${new Date(t.fecha_limite).toLocaleDateString('es-CO')}</span>` : ''}
          </div>
        </div>
        <span class="badge ${t.completada ? 'badge-green' : t.prioridad === 'alta' ? 'badge-rose' : 'badge-amber'}">
          ${t.completada ? 'Completada' : t.prioridad || 'media'}
        </span>
      </div>
    `).join('');
  }

  // ══ PROYECTOS ══
  loadProyectos() {
    this.apiService.getProyectos().subscribe({
      next: (res) => {
        const proyectos = res.data || res || [];
        this.renderProyectos(Array.isArray(proyectos) ? proyectos : []);
      },
      error: (err) => console.error('Error proyectos', err)
    });
  }

  renderProyectos(proyectos: any[]) {
    const el = document.getElementById('projects-grid');
    if (!el) return;

    const countEl = document.getElementById('proj-count');
    if (countEl) countEl.textContent = `${proyectos.length} proyectos registrados`;

    if (proyectos.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay proyectos registrados.</div>';
      return;
    }

    const colores = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    el.innerHTML = proyectos.map((p, i) => {
      const avance = p.avance_pct ?? Math.floor(Math.random() * 80 + 10);
      const color = colores[i % colores.length];
      const fecha = p.fecha_limite ? new Date(p.fecha_limite).toLocaleDateString('es-CO') : '—';
      const estadoBadge = p.estado === 'activo' ? 'badge-green'
        : p.estado === 'pausado' ? 'badge-amber'
          : p.estado === 'finalizado' ? 'badge-info' : 'badge-amber';
      return `
        <div class="proj-card">
          <div class="pc-top">
            <span class="pc-color" style="background:${color}"></span>
            <span class="badge ${estadoBadge}">${p.estado || 'activo'}</span>
          </div>
          <div class="pc-title">${p.titulo || '—'}</div>
          <div class="pc-desc">${(p.descripcion || 'Sin descripción').substring(0, 80)}${(p.descripcion || '').length > 80 ? '...' : ''}</div>
          <div class="prog-track">
            <div class="prog-fill" style="width:${avance}%; background:${color}"></div>
          </div>
          <div class="pc-footer">
            <span>${avance}% completado</span>
            <span>📅 ${fecha}</span>
          </div>
        </div>
      `;
    }).join('');

    // Búsqueda y filtro
    const search = document.getElementById('proj-search') as HTMLInputElement;
    const filtro = document.getElementById('proj-filtro-estado') as HTMLSelectElement;

    const filtrar = () => {
      const q = search?.value.toLowerCase() || '';
      const estado = filtro?.value || 'all';
      const cards = el.querySelectorAll('.proj-card');
      cards.forEach((card, i) => {
        const p = proyectos[i];
        const matchQ = !q || (p.titulo || '').toLowerCase().includes(q);
        const matchE = estado === 'all' || p.estado === estado;
        (card as HTMLElement).style.display = matchQ && matchE ? '' : 'none';
      });
    };

    search?.addEventListener('input', filtrar);
    filtro?.addEventListener('change', filtrar);
  }

  // ══ NOTAS ══
  loadNotas() {
    this.apiService.getEvaluaciones().subscribe({
      next: (res) => {
        const notas = res.data || res || [];
        this.renderNotas(Array.isArray(notas) ? notas : []);
      },
      error: (err) => console.error('Error notas', err)
    });
  }

  renderNotas(evaluaciones: any[]) {
    const el = document.getElementById('grades-wrap');
    if (!el) return;

    const resumen = document.getElementById('notas-resumen');
    if (resumen) resumen.textContent = `${evaluaciones.length} evaluaciones registradas`;

    if (evaluaciones.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay notas registradas.</div>';
      return;
    }

    // Agrupar por proyecto
    const grupos: { [key: string]: any[] } = {};
    evaluaciones.forEach(e => {
      const key = e.id_proyecto?.titulo || e.proyecto || 'Sin proyecto';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(e);
    });

    el.innerHTML = Object.entries(grupos).map(([proyecto, evals]) => {
      const promedio = evals
        .filter(e => e.calificacion != null)
        .reduce((sum, e, _, arr) => sum + e.calificacion / arr.length, 0);

      const promedioColor = promedio >= 7 ? 'high' : promedio >= 5 ? 'ok' : 'warn';

      return `
        <div class="grade-card">
          <div class="gc-header">
            <div class="gc-course">${proyecto}</div>
          </div>
          <div class="gc-rows">
            ${evals.map(e => `
              <div class="gc-row">
                <span>${e.titulo || e.tipo || '—'}</span>
                <span class="gcv ${e.calificacion >= 7 ? 'high' : e.calificacion >= 5 ? 'ok' : 'warn'}">
                  ${e.calificacion != null ? e.calificacion.toFixed(1) : 'Falla'}
                </span>
              </div>
            `).join('')}
          </div>
          <div class="gc-avg">
            <span>Promedio</span>
            <span class="gc-avg-val gcv ${promedioColor}">
              ${promedio ? promedio.toFixed(1) : '—'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ══ NOTICIAS ══
  loadNoticias() {
    this.apiService.getNoticias().subscribe({
      next: (res) => {
        const noticias = res.data || [];
        this.renderNoticias(noticias);
      },
      error: (err) => console.error('Error noticias', err)
    });
  }

  renderNoticias(noticias: any[]) {
    const el = document.getElementById('news-grid');
    if (!el) return;

    const countEl = document.getElementById('news-count');
    if (countEl) countEl.textContent = `${noticias.length} noticias publicadas`;

    if (noticias.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay noticias publicadas.</div>';
      return;
    }

    el.innerHTML = noticias.map(n => `
      <div class="news-card">
        ${n.imagen ? `
          <div class="news-img-wrap">
            <img class="news-img" src="http://localhost:3000${n.imagen}" alt="${n.titulo}" onerror="this.parentElement.style.display='none'">
          </div>` : ''}
        <div style="padding: ${n.imagen ? '1.1rem' : '0'}">
          <span class="news-cat nc-info">${n.categoria || 'general'}</span>
          <div class="news-h">${n.titulo}</div>
          <div class="news-b">${(n.contenido || '').substring(0, 120)}${(n.contenido || '').length > 120 ? '...' : ''}</div>
          <div class="news-m">${n.createdAt ? new Date(n.createdAt).toLocaleDateString('es-CO') : ''}</div>
        </div>
      </div>
    `).join('');
  }

  // ══ USUARIOS ══
  loadUsuarios() {
    if (this.usuario?.rol !== 'admin') return;
    this.apiService.getUsuarios().subscribe({
      next: (res) => {
        const usuarios = res.data || res || [];
        this.renderUsuarios(Array.isArray(usuarios) ? usuarios : []);
      },
      error: (err) => console.error('Error usuarios', err)
    });
  }

  renderUsuarios(usuarios: any[]) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    const countEl = document.getElementById('users-count-label');
    if (countEl) countEl.textContent = `${usuarios.length} usuarios registrados`;

    if (usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No hay usuarios.</td></tr>';
      return;
    }

    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td>${u.nombre} ${u.apellido || ''}</td>
        <td>${u.email}</td>
        <td><span class="badge badge-info">${u.rol}</span></td>
        <td><span class="badge ${u.activo ? 'badge-green' : 'badge-rose'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>
          <button class="btn btn-danger btn-xs" onclick="this.dispatchEvent(new CustomEvent('desactivar', {bubbles:true, detail:'${u._id}'}))">
            Desactivar
          </button>
        </td>
      </tr>
    `).join('');
  }

  // ══ PDF ══
  descargarPDF(url: string, btn: HTMLElement) {
    const token = localStorage.getItem('eduhub-token');
    if (!token) return;

    const textoOriginal = btn.innerHTML;
    btn.innerHTML = 'Generando...';
    btn.setAttribute('disabled', 'true');

    const tipo = url.includes('proyectos') ? 'proyectos'
      : url.includes('tareas') ? 'tareas'
        : url.includes('notas') ? 'notas'
          : url.includes('usuarios') ? 'usuarios'
            : null;

    if (!tipo) {
      btn.innerHTML = textoOriginal;
      btn.removeAttribute('disabled');
      return;
    }

    fetch(`http://localhost:3000/api/reportes/pdf/${tipo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_${tipo}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(err => {
        console.error('Error PDF:', err);
        alert('Error al generar el PDF.');
      })
      .finally(() => {
        btn.innerHTML = textoOriginal;
        btn.removeAttribute('disabled');
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  switchSection(section: string) {
    this.activeSection = section;
    // Recargar datos al cambiar sección para tener datos frescos
    setTimeout(() => {
      if (section === 'proyectos') this.loadProyectos();
      if (section === 'tareas') this.loadTareas();
      if (section === 'notas') this.loadNotas();
      if (section === 'noticias') this.loadNoticias();
      if (section === 'usuarios') this.loadUsuarios();
    }, 50);
  }
}