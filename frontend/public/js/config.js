// config.js — configuración compartida del frontend EduHub
(function () {
  const DEFAULT_API_BASE = 'http://localhost:3000/api';
  const configured = window.EDUHUB_API_BASE || localStorage.getItem('eduhub-api-base');
  const base = (configured || DEFAULT_API_BASE).replace(/\/+$/, '');

  window.EduHubConfig = Object.freeze({
    API_BASE: base,
  });
})();