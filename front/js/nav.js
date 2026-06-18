/* =============================================================
   nav.js — Sidebar active state, 3-role switcher, renderForRole
   ============================================================= */

var ROLE_PROFILES = {
  estudiante:     { name: 'María Pérez',      sub: 'Estudiante · 8vo Semestre',        initials: 'MP' },
  profesor:       { name: 'Carlos Rodríguez', sub: 'Docente · Asistente',              initials: 'CR' },
  egresado:       { name: 'Ana Martínez',     sub: 'Egresada · Ing. Informática 2023', initials: 'AM' },
  administrativo: { name: 'Luis Pérez',       sub: 'Administrativo · DIDT',            initials: 'LP' }
};

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Active nav state ---------- */
  var path = window.location.pathname;
  var filename = path.split('/').pop() || 'index.html';

  var navMap = {
    'dashboard.html':       'dashboard',
    'servicios.html':       'servicios',
    'pagos.html':           'pagos',
    'infraestructura.html': 'infraestructura',
    'estacionamiento.html': 'estacionamiento',
    'carrera.html':         'carrera',
    'index.html':           path.includes('reportes') ? 'reportes' : 'dashboard',
    'eficiencia.html':      'reportes',
    'financiero.html':      'reportes',
    'comunidad.html':       'reportes',
  };

  var key = navMap[filename] || filename.replace('.html', '');

  document.querySelectorAll('.sidebar-item[data-nav]').forEach(function (el) {
    el.classList.toggle('active', el.dataset.nav === key);
  });
  document.querySelectorAll('.navbar-tab[data-nav]').forEach(function (el) {
    el.classList.toggle('active', el.dataset.nav === key);
  });

  /* ---------- Role switcher: build in sidebar ---------- */
  var sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav) {
    var existing = document.getElementById('sidebar-role-switcher');
    if (!existing) {
      var wrapper = document.createElement('div');
      wrapper.id = 'sidebar-role-switcher';
      wrapper.innerHTML =
        '<div class="sidebar-role-label">VISTA DE ROL</div>' +
        '<div class="sidebar-role-btns">' +
          '<button type="button" class="sidebar-role-btn active" data-role="estudiante">Estudiante</button>' +
          '<button type="button" class="sidebar-role-btn" data-role="profesor">Profesor</button>' +
          '<button type="button" class="sidebar-role-btn" data-role="egresado">Egresado</button>' +
          '<button type="button" class="sidebar-role-btn" data-role="administrativo">Administrativo</button>' +
        '</div>';
      sidebarNav.after(wrapper);

      wrapper.addEventListener('click', function (e) {
        var btn = e.target.closest('.sidebar-role-btn');
        if (!btn || !btn.dataset.role) return;
        setRole(btn.dataset.role);
      });
    }
  }

  /* Hide legacy navbar role-switcher to avoid duplication */
  var navSwitcher = document.querySelector('.navbar-right .role-switcher');
  if (navSwitcher) navSwitcher.style.display = 'none';

  applyRoleUI(window.currentRole);
});

/* ---------- Set role globally ---------- */
function setRole(role) {
  window.currentRole = role;
  applyRoleUI(role);

  /* Update sidebar profile */
  var p = ROLE_PROFILES[role] || ROLE_PROFILES.estudiante;
  var nameEl = document.querySelector('.sidebar-profile-name');
  var subEl  = document.querySelector('.sidebar-profile-sub');
  var avEl   = document.querySelector('.sidebar-avatar');
  if (nameEl) nameEl.textContent = p.name;
  if (subEl)  subEl.textContent  = p.sub;
  if (avEl)   avEl.textContent   = p.initials;

  /* Update navbar avatar */
  var navAv = document.querySelector('.navbar-avatar');
  if (navAv) navAv.textContent = p.initials;

  /* Dispatch to page-specific renderer */
  if (typeof window.renderForRole === 'function') {
    window.renderForRole(role);
  }

  /* data-role visibility helpers */
  ['estudiante', 'profesor', 'egresado', 'administrativo'].forEach(function (r) {
    document.querySelectorAll('[data-role="' + r + '"]').forEach(function (el) {
      el.style.display = (r === role) ? '' : 'none';
    });
  });
}

function applyRoleUI(role) {
  /* Update sidebar role buttons */
  var wrapper = document.getElementById('sidebar-role-switcher');
  if (wrapper) {
    wrapper.querySelectorAll('.sidebar-role-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.role === role);
    });
  }
  /* Also update legacy navbar switcher if present */
  var navSwitcher = document.querySelector('.role-switcher');
  if (navSwitcher) {
    navSwitcher.querySelectorAll('.role-switcher-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.role === role);
    });
  }
}
