/* auth-guard.js — session helpers available on window */

var NAV_PERMISOS = {
  estudiante:     ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'carrera'],
  egresado:       ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'carrera'],
  profesor:       ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'reportes'],
  administrativo: ['dashboard', 'servicios', 'pagos', 'infraestructura', 'estacionamiento', 'carrera', 'reportes']
};

function _loginPath() {
  return window.location.pathname.includes('/reportes/') ? '../login.html' : 'login.html';
}

function _dashPath() {
  return window.location.pathname.includes('/reportes/') ? '../dashboard.html' : 'dashboard.html';
}

function getUsuario() {
  var raw = sessionStorage.getItem('usuario');
  if (!raw) { window.location.href = _loginPath(); return null; }
  try { return JSON.parse(raw); } catch (e) { window.location.href = _loginPath(); return null; }
}

function getRoles() {
  var u = getUsuario();
  return u ? u.roles.map(function (r) { return r.rol; }) : [];
}

function getRolData(rol) {
  var u = getUsuario();
  if (!u) return null;
  return u.roles.find(function (r) { return r.rol === rol; }) || null;
}

function tieneRol(rol) {
  var raw = sessionStorage.getItem('usuario');
  if (!raw) return false;
  try {
    var u = JSON.parse(raw);
    return u.roles.some(function (r) { return r.rol === rol; });
  } catch (e) { return false; }
}

function cerrarSesion() {
  sessionStorage.clear();
  window.location.href = _loginPath();
}

function checkPageAccess() {
  var raw = sessionStorage.getItem('usuario');
  if (!raw) return; /* getUsuario will redirect */
  var usuario;
  try { usuario = JSON.parse(raw); } catch (e) { return; }

  var pathname = window.location.pathname;
  var filename = pathname.split('/').pop() || '';
  var currentPage;

  if (pathname.includes('/reportes/') && filename === 'index.html') {
    currentPage = 'reportes';
  } else {
    currentPage = filename.replace('.html', '');
  }

  /* Always allowed */
  if (currentPage === 'login' || currentPage === '') return;

  var rolActivo = sessionStorage.getItem('rolActivo');
  /* Validate saved role still belongs to this user */
  if (rolActivo && !usuario.roles.some(function (r) { return r.rol === rolActivo; })) {
    rolActivo = null;
  }
  if (!rolActivo) {
    rolActivo = usuario.roles[0] ? usuario.roles[0].rol : null;
  }
  if (!rolActivo) return;

  var permitidos = NAV_PERMISOS[rolActivo] || [];
  if (permitidos.indexOf(currentPage) === -1) {
    window.location.href = _dashPath();
  }
}

document.addEventListener('DOMContentLoaded', checkPageAccess);

window.NAV_PERMISOS  = NAV_PERMISOS;
window.getUsuario    = getUsuario;
window.getRoles      = getRoles;
window.getRolData    = getRolData;
window.tieneRol      = tieneRol;
window.cerrarSesion  = cerrarSesion;
window.checkPageAccess = checkPageAccess;
