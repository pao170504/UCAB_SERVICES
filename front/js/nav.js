/* nav.js */

/* Updated permissions: carrera is egresado-only */
window.NAV_PERMISOS = {
  estudiante:     ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'acreditaciones'],
  egresado:       ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'carrera', 'acreditaciones'],
  profesor:       ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'beneficiarios', 'acreditaciones'],
  administrativo: ['dashboard', 'usuarios', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'admin', 'beneficiarios', 'acreditaciones']
};

var _usuario = null;

document.addEventListener('DOMContentLoaded', function () {
  _usuario = getUsuario();
  if (!_usuario) return;

  /* --- Sidebar profile --- */
  var nombreEl = document.getElementById('sidebar-nombre');
  if (nombreEl) nombreEl.textContent = _usuario.nombre;

  var initials = _initials(_usuario.nombre);
  var navAv  = document.querySelector('.navbar-avatar');
  if (navAv)  navAv.textContent  = initials;
  var sideAv = document.getElementById('sidebar-avatar');
  if (sideAv) sideAv.textContent = initials;

  /* --- Restore or default active role --- */
  var savedRol = sessionStorage.getItem('rolActivo');
  var rolInicial = null;
  if (savedRol && _usuario.roles.some(function (r) { return r.rol === savedRol; })) {
    rolInicial = savedRol;
  } else {
    rolInicial = _usuario.roles[0] ? _usuario.roles[0].rol : null;
  }
  if (rolInicial) activarRol(rolInicial);

  /* --- Mark active sidebar link --- */
  var filename = window.location.pathname.split('/').pop() || 'index.html';
  var PAGE_MAP = {
    'dashboard.html':       'dashboard',
    'admin.html':           'usuarios',
    'servicios.html':       'servicios',
    'pagos.html':           'pagos',
    'infraestructura.html': 'infraestructura',
    'estacionamiento.html': 'estacionamiento',
    'carrera.html':         'carrera',
    'beneficiarios.html':   'beneficiarios',
    'acreditaciones.html':  'acreditaciones'
  };
  var currentPage = PAGE_MAP[filename] || filename.replace('.html', '');
  document.querySelectorAll('.sidebar-item[data-page]').forEach(function (el) {
    el.classList.toggle('active', el.getAttribute('data-page') === currentPage);
  });
  document.querySelectorAll('.navbar-tab[data-nav]').forEach(function (el) {
    el.classList.toggle('active', el.getAttribute('data-nav') === currentPage);
  });

  /* --- Cerrar sesión --- */
  var logoutBtn = document.getElementById('btn-cerrar-sesion');
  if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);
});

function activarRol(rol) {
  window.currentRole = rol;
  sessionStorage.setItem('rolActivo', rol);

  /* Update sidebar subtitle */
  var rolData = _usuario ? (_usuario.roles || []).find(function (r) { return r.rol === rol; }) : null;
  var subtitulo = '';
  if (rol === 'estudiante' && rolData) {
    subtitulo = 'Estudiante · ' + (rolData.semestre || '?') + 'mo Semestre';
    if (rolData.beca) subtitulo += ' · Becario (' + rolData.beca.tipo + ')';
  } else if (rol === 'profesor' && rolData) {
    subtitulo = 'Docente · ' + (rolData.escalafon || '');
    if (rolData.codigoInvestigador) subtitulo += ' · Investigador';
  } else if (rol === 'egresado' && rolData) {
    subtitulo = 'Egresado · ' + (rolData.titulo || '') + ' ' + (rolData.ano_graduacion || '');
  } else if (rol === 'administrativo' && rolData) {
    subtitulo = (rolData.cargo || '') + ' · ' + (rolData.unidad_adscripcion || '');
  }
  var subEl = document.getElementById('sidebar-subtitulo');
  if (subEl) subEl.textContent = subtitulo;

  /* Show/hide sidebar items AND navbar tabs based on permissions (el navbar
     debe reflejar exactamente las mismas páginas que el sidebar).
     Las páginas de administrador del sistema (usuarios/admin) además exigen
     esAdminSistema(): un administrativo común NO debe verlas en ninguno de los dos. */
  var permisos = (window.NAV_PERMISOS || {})[rol] || [];
  var ADMIN_ONLY  = ['usuarios', 'admin'];
  var _esAdminSys = (typeof esAdminSistema === 'function') && esAdminSistema();
  function _visible(page) {
    return permisos.indexOf(page) !== -1 &&
           (ADMIN_ONLY.indexOf(page) === -1 || _esAdminSys);
  }
  document.querySelectorAll('.sidebar-item[data-page]').forEach(function (item) {
    item.style.display = _visible(item.getAttribute('data-page')) ? '' : 'none';
  });
  document.querySelectorAll('.navbar-tab[data-nav]').forEach(function (item) {
    item.style.display = _visible(item.getAttribute('data-nav')) ? '' : 'none';
  });

  /* Call page-specific renderer (backward compat) */
  if (typeof window.renderForRole === 'function') {
    window.renderForRole(rol);
  }

  /* Dispatch event for pages that listen */
  document.dispatchEvent(new CustomEvent('roleChanged', {
    detail: { rol: rol, rolData: rolData, usuario: _usuario }
  }));
}

function _initials(nombre) {
  var parts = (nombre || '').trim().split(/\s+/);
  return parts.slice(0, 2).map(function (p) { return (p[0] || '').toUpperCase(); }).join('');
}

window.activarRol = activarRol;
