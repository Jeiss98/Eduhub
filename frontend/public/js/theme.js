// theme.js — Gestión de temas Claro/Oscuro (v2)
// Nota: el snippet anti-FOUC del <head> ya aplica el tema antes del render.
// Este archivo se encarga del botón interactivo y su label.

(function () {
    const html = document.documentElement;

    // Asegurar que el tema esté aplicado (por si el snippet no estuviera)
    const savedTheme = localStorage.getItem('eduhub-theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);

    function updateBtn(theme) {
        // Botones con <span class="theme-icon"> (index, login)
        document.querySelectorAll('.theme-icon').forEach(function (span) {
            span.textContent = theme === 'light' ? '☀️' : '🌙';
        });

        // Botones con texto directo (admin, dashboard topbar)
        document.querySelectorAll('.sb-theme').forEach(function (btn) {
            btn.textContent = theme === 'light' ? '☀️ Modo claro' : '🌙 Modo oscuro';
        });
    }

    function toggle() {
        const current = html.getAttribute('data-theme') || 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        localStorage.setItem('eduhub-theme', next);
        updateBtn(next);
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Actualizar labels al cargar
        updateBtn(savedTheme);

        // Vincular TODOS los botones con id="theme-btn" o clase .theme-btn
        document.querySelectorAll('#theme-btn, .theme-btn').forEach(function (btn) {
            btn.addEventListener('click', toggle);
        });
    });
})();
