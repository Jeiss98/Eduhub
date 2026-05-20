/**
 * index.js — Modern & Youthful Redesign Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    EduHub.init();
});

const EduHub = {
    API_BASE: window.EduHubConfig?.API_BASE || 'http://localhost:3000/api',

    init() {
        console.log('🚀 EduHub Modern Initialized');
        
        this.setupTheme();
        this.setupNavScroll();
        this.fetchStats();
        this.fetchNoticias();
        this.setupIntersectionObservers();
    },

    // ── THEME ──────────────────────────────────────────────────────────
    setupTheme() {
        // Delegado íntegramente a theme.js (cargado en el HTML).
        // theme.js aplica el tema, vincula #theme-btn y actualiza el ícono.
    },


    // ── NAV SCROLL ────────────────────────────────────────────────────
    setupNavScroll() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 50);
        });
    },

    // ── STATS ─────────────────────────────────────────────────────────
    async fetchStats() {
        try {
            const response = await fetch(`${this.API_BASE}/reportes/dashboard`);
            const data = await response.json();
            this.statsData = data.ok ? data.data : { totalUsuarios: 2400, totalProyectos: 850 };
            
            // Initial animation if visible
            this.animateCount(document.getElementById('stat-usuarios'), this.statsData.totalUsuarios);
            this.animateCount(document.getElementById('stat-proyectos'), this.statsData.totalProyectos);
        } catch (error) {
            this.statsData = { totalUsuarios: 2400, totalProyectos: 850 };
            this.animateCount(document.getElementById('stat-usuarios'), 2400);
            this.animateCount(document.getElementById('stat-proyectos'), 850);
        }
    },

    animateCount(el, target, duration = 2000) {
        if (!el || isNaN(target)) return;
        let start = null;
        const targetVal = parseInt(target);
        const step = ts => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.floor(ease * targetVal).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    },

    // ── NEWS ──────────────────────────────────────────────────────────
    async fetchNoticias() {
        const container = document.getElementById('news-cascade');
        if (!container) return;

        try {
            let response = await fetch(`${this.API_BASE}/noticias`);
            let data = await response.json();
            let noticias = data.data || data; 

            if (!Array.isArray(noticias) || noticias.length === 0) {
                this.renderNews([]); 
            } else {
                this.renderNews(noticias);
            }
        } catch (error) {
            this.renderNews([]); 
        }
    },

    renderNews(data) {
        const container = document.getElementById('news-cascade');
        if (!container) return;

        const sampleNews = [
            {
                titulo: "Lanzamiento de EduHub v2.0",
                categoria: "Plataforma",
                descripcion: "La nueva versión de EduHub trae mejoras significativas en la gestión de proyectos académicos y una experiencia de usuario renovada.",
                fecha: "Abril 2026",
                emoji: "🚀",
                imagen: null
            },
            {
                titulo: "Integración con MongoDB Atlas",
                categoria: "Tecnología",
                descripcion: "EduHub ahora combina MySQL y MongoDB Atlas para ofrecer la máxima flexibilidad en el almacenamiento y consulta de datos académicos.",
                fecha: "Marzo 2026",
                emoji: "🍃",
                imagen: null
            },
            {
                titulo: "Nuevo módulo de evaluaciones",
                categoria: "Académico",
                descripcion: "Docentes pueden ahora registrar notas y enviar retroalimentación directamente desde la plataforma, en tiempo real.",
                fecha: "Febrero 2026",
                emoji: "📊",
                imagen: null
            }
        ];

        const newsToRender = (Array.isArray(data) && data.length > 0) ? data : sampleNews;
        container.innerHTML = '';

        newsToRender.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'news-card';

            const title = this.escapeHTML(item.titulo || 'Noticia');
            const emoji = this.escapeHTML(item.emoji || '📰');
            const category = this.escapeHTML(item.categoria || 'Noticia');
            const description = this.escapeHTML(this.truncateText(item.descripcion || item.contenido, 130));
            const date = this.escapeHTML(item.fecha || '2026');
            const imgUrl = this.safeUrl(item.imagen || item.image || item.img || item.imageUrl || null);
            const imgSection = imgUrl
                ? `<div class="news-img-wrap">
                       <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'news-img-placeholder\\'>${emoji}</div>'">
                   </div>`
                : `<div class="news-img-wrap">
                       <div class="news-img-placeholder">${emoji}</div>
                   </div>`;

            el.innerHTML = `
                ${imgSection}
                <div class="news-body">
                    <span class="news-tag">${category}</span>
                    <h3 class="news-title">${title}</h3>
                    <p class="news-desc">${description}</p>
                    <div class="news-footer">
                        <span class="news-date">${date}</span>
                        <a href="#" class="news-read-btn" aria-label="Leer noticia">
                            Leer más
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                    </div>
                </div>`;

            container.appendChild(el);
            if (this.observer) this.observer.observe(el);
        });
    },

    // ── OBSERVERS ─────────────────────────────────────────────────────
    setupIntersectionObservers() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    if (e.target.classList.contains('news-card')) {
                        e.target.classList.add('visible');
                    } else {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'translateY(0)';
                    }
                    this.observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });

        // feat-card & tech-card: inline style approach (CSS animation fallback)
        document.querySelectorAll('.feat-card, .tech-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s var(--ease-out)';
            this.observer.observe(el);
        });

        // news-card: class-based approach
        document.querySelectorAll('.news-card').forEach(el => {
            this.observer.observe(el);
        });
    },

    escapeHTML(value) {
        const div = document.createElement('div');
        div.textContent = value ?? '';
        return div.innerHTML;
    },

    safeUrl(value) {
        if (!value) return '';
        try {
            const url = new URL(value, window.location.href);
            return ['http:', 'https:', 'data:'].includes(url.protocol) ? url.href : '';
        } catch {
            return '';
        }
    },

    truncateText(text, limit) {
        if (!text) return '';
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }
};

window.EduHub = EduHub;

