/* =============================================================
   admin.js — Control de Usuarios (solo Personal Administrativo)
   Usa los endpoints /api/admin/* ya existentes en el backend.
   ============================================================= */

const SID = () => sessionStorage.getItem('sessionID');
function authHeaders(json) {
  const h = { 'Authorization': 'Bearer ' + SID() };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}
async function api(path, opts) {
  opts = opts || {};
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: authHeaders(!!opts.body),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

/* ---- estado de la página ---- */
let TODOS_USUARIOS = [];
let PAGINA = 1;
const POR_PAGINA = 10;
let YO = null;                 // cédula del admin en sesión
let VINC_CEDULA = null;        // cédula abierta en el modal de vinculaciones

const ROL_BADGE = {
  'Estudiante':     'badge-blue',
  'Profesor':       'badge-navy',
  'Administrativo': 'badge-purple',
  'Egresado':       'badge-teal'
};
const ESTADO_BADGE = {
  'Activa':     'badge-success',
  'Suspendida': 'badge-warning',
  'Bloqueada':  'badge-danger'
};

document.addEventListener('DOMContentLoaded', function () {
  // Guard: solo el administrador del sistema (allowlist en auth-guard.js / config/admins.js).
  var u = getUsuario();
  if (!u || !esAdminSistema()) {
    showToast('Esta sección es solo para el administrador del sistema', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    return;
  }
  YO = u.cedula;
  cargarUsuarios();
  cargarAprobaciones();
});

/* ================= TABS ================= */
function cambiarTab(tab) {
  document.querySelectorAll('.tab-pill[data-tab]').forEach(b =>
    b.classList.toggle('active', b.getAttribute('data-tab') === tab));
  const TABS = ['usuarios', 'vinculaciones', 'aprobaciones', 'vacantes', 'tasas', 'acreditaciones', 'folios'];
  TABS.forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = (t === tab) ? '' : 'none';
  });
  if (tab === 'vinculaciones')   renderVinc();
  if (tab === 'vacantes')        cargarVacantesAdmin();
  if (tab === 'tasas')           cargarTasas();
  if (tab === 'acreditaciones')  cargarAcredAdmin();
}
window.cambiarTab = cambiarTab;

/* ================= USUARIOS ================= */
async function cargarUsuarios() {
  const tbody = document.getElementById('usuarios-tbody');
  try {
    const data = await api('/admin/usuarios');
    TODOS_USUARIOS = data.usuarios || [];
    PAGINA = 1;
    renderUsuarios();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-danger);padding:var(--space-5);">' +
      err.message + '</td></tr>';
  }
}

function usuariosFiltrados() {
  const q = (document.getElementById('buscar-usuario').value || '').toLowerCase().trim();
  const est = document.getElementById('filtro-estado').value;
  return TODOS_USUARIOS.filter(u => {
    const coincide = !q ||
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.cedula || '').toLowerCase().includes(q) ||
      (u.correo_institucional || '').toLowerCase().includes(q);
    const estadoOk = !est || u.estado_de_cuenta === est;
    return coincide && estadoOk;
  });
}

function filtrarUsuarios() { PAGINA = 1; renderUsuarios(); }
window.filtrarUsuarios = filtrarUsuarios;

function renderUsuarios() {
  const lista = usuariosFiltrados();
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (PAGINA > totalPaginas) PAGINA = totalPaginas;
  const inicio = (PAGINA - 1) * POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + POR_PAGINA);

  const tbody = document.getElementById('usuarios-tbody');
  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:var(--space-5);">No se encontraron usuarios.</td></tr>';
  } else {
    tbody.innerHTML = pagina.map(u => {
      const roles = (u.roles_activos || []).length
        ? u.roles_activos.map(r => '<span class="badge ' + (ROL_BADGE[r] || 'badge-gray') + '">' + r + '</span>').join(' ')
        : '<span class="badge badge-gray">Sin rol</span>';
      const estadoBadge = '<span class="badge ' + (ESTADO_BADGE[u.estado_de_cuenta] || 'badge-gray') + '">' +
        u.estado_de_cuenta + '</span>';
      const ultima = u.ultima_sesion ? formatDate(u.ultima_sesion) : '—';
      const esYo = u.cedula === YO;
      const selectEstado =
        '<select class="form-select estado-select" ' + (esYo ? 'disabled title="No puedes cambiar tu propio estado"' : '') +
        ' onchange="cambiarEstado(\'' + u.cedula + '\', this.value)">' +
        ['Activa', 'Suspendida', 'Bloqueada'].map(e =>
          '<option value="' + e + '"' + (e === u.estado_de_cuenta ? ' selected' : '') + '>' + e + '</option>').join('') +
        '</select>';

      return '<tr>' +
        '<td class="font-mono text-sm">V-' + u.cedula + '</td>' +
        '<td><strong>' + (u.nombre || '—') + '</strong></td>' +
        '<td class="text-sm">' + (u.correo_institucional || '—') + '</td>' +
        '<td>' + roles + '</td>' +
        '<td>' + estadoBadge + '</td>' +
        '<td class="text-sm">' + ultima + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
            '<button class="btn btn-outline btn-sm" title="Roles y vinculaciones" onclick="abrirVinculaciones(\'' + u.cedula + '\',\'' + (u.nombre || '').replace(/'/g, "\\'") + '\')">Roles</button>' +
            '<button class="btn btn-outline btn-sm" title="Restablecer contraseña" onclick="abrirPassword(\'' + u.cedula + '\',\'' + (u.nombre || '').replace(/'/g, "\\'") + '\')">Clave</button>' +
            selectEstado +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  document.getElementById('usuarios-info').textContent =
    total === 0 ? 'Sin resultados'
                : 'Mostrando ' + (inicio + 1) + '–' + Math.min(inicio + POR_PAGINA, total) + ' de ' + total + ' miembros';

  // controles de paginación
  const ctr = document.getElementById('usuarios-paginacion');
  let html = '<button class="page-btn" ' + (PAGINA <= 1 ? 'disabled' : '') + ' onclick="irPagina(' + (PAGINA - 1) + ')">‹</button>';
  for (let p = 1; p <= totalPaginas; p++) {
    html += '<button class="page-btn ' + (p === PAGINA ? 'active' : '') + '" onclick="irPagina(' + p + ')">' + p + '</button>';
  }
  html += '<button class="page-btn" ' + (PAGINA >= totalPaginas ? 'disabled' : '') + ' onclick="irPagina(' + (PAGINA + 1) + ')">›</button>';
  ctr.innerHTML = html;
}

function irPagina(p) { PAGINA = p; renderUsuarios(); }
window.irPagina = irPagina;

async function cambiarEstado(cedula, estado) {
  try {
    const r = await api('/admin/usuarios/' + cedula + '/estado', { method: 'PATCH', body: { estado } });
    showToast(r.message || 'Estado actualizado', 'success');
    const u = TODOS_USUARIOS.find(x => x.cedula === cedula);
    if (u) u.estado_de_cuenta = estado;
    renderUsuarios();
  } catch (err) {
    showToast(err.message, 'error');
    renderUsuarios();   // revierte el select visualmente
  }
}
window.cambiarEstado = cambiarEstado;

/* ================= RESET CONTRASEÑA ================= */
let PWD_CEDULA = null;
function abrirPassword(cedula, nombre) {
  PWD_CEDULA = cedula;
  document.getElementById('pwd-target').textContent = 'Miembro: ' + nombre + ' (V-' + cedula + ')';
  document.getElementById('pwd-input').value = '';
  openModal('modal-pwd');
}
window.abrirPassword = abrirPassword;

async function guardarPassword() {
  const val = document.getElementById('pwd-input').value;
  if (!val || val.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'warning'); return; }
  try {
    const r = await api('/admin/usuarios/' + PWD_CEDULA + '/contrasena', { method: 'PATCH', body: { nuevaContrasena: val } });
    showToast(r.message || 'Contraseña actualizada', 'success');
    closeModal('modal-pwd');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.guardarPassword = guardarPassword;

/* ================= VINCULACIONES / ROLES ================= */
async function abrirVinculaciones(cedula, nombre, abrirAdd) {
  VINC_CEDULA = cedula;
  document.getElementById('vinc-title').textContent = 'Roles de ' + nombre;
  document.getElementById('add-rol-form').style.display = 'none';
  document.getElementById('vinc-actuales').innerHTML = '<p style="color:var(--color-text-muted);">Cargando…</p>';
  openModal('modal-vinc');
  await refrescarVinculaciones();
  if (abrirAdd) { document.getElementById('add-rol-form').style.display = ''; renderCamposRol(); }
}
window.abrirVinculaciones = abrirVinculaciones;

async function refrescarVinculaciones() {
  try {
    const data = await api('/admin/usuarios/' + VINC_CEDULA + '/vinculaciones');
    const vincs = data.vinculaciones || [];
    const activos  = vincs.filter(v => v.estado === 'Activo');
    const cerrados = vincs.filter(v => v.estado === 'Cerrado');
    const cont = document.getElementById('vinc-actuales');

    let html = '';
    if (activos.length === 0) {
      html += '<p style="color:var(--color-text-muted);">Sin rol activo.</p>';
    } else {
      html += activos.map(v =>
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">' +
          '<div><strong>' + v.rol + '</strong> <span class="badge badge-success" style="margin-left:6px;">Activo</span>' +
            detalleRol(v) + '</div>' +
        '</div>').join('');
      html += '<button class="btn btn-danger btn-sm btn-full" style="margin-top:var(--space-3);" onclick="cerrarPeriodo()">Cerrar período activo</button>';
    }

    if (cerrados.length) {
      html += '<div class="section-title" style="margin:var(--space-4) 0 var(--space-2);font-size:.78rem;">Períodos anteriores</div>';
      html += cerrados.map(v =>
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:.85rem;color:var(--color-text-secondary);">' +
          '<span>' + v.rol + '</span><span class="badge badge-gray">Cerrado</span>' +
        '</div>').join('');
    }
    cont.innerHTML = html;
  } catch (err) {
    document.getElementById('vinc-actuales').innerHTML =
      '<p style="color:var(--color-danger);">' + err.message + '</p>';
  }
}

function detalleRol(v) {
  const bits = [];
  if (v.rol === 'Estudiante') { if (v.escuela) bits.push(v.escuela); if (v.semestre) bits.push(v.semestre + 'º sem'); }
  if (v.rol === 'Profesor')   { if (v.escalafon) bits.push(v.escalafon); }
  if (v.rol === 'Administrativo') { if (v.cargo) bits.push(v.cargo); }
  if (v.rol === 'Egresado')   { if (v.titulo) bits.push(v.titulo); if (v.ano_graduacion) bits.push(String(v.ano_graduacion)); }
  return bits.length ? '<div class="text-sm text-secondary" style="margin-top:2px;">' + bits.join(' · ') + '</div>' : '';
}

async function cerrarPeriodo() {
  if (!confirm('¿Cerrar el período de vinculación activo de este miembro?')) return;
  try {
    const r = await api('/admin/usuarios/' + VINC_CEDULA + '/vinculaciones/cerrar', { method: 'PATCH' });
    showToast(r.message || 'Período cerrado', 'success');
    await refrescarVinculaciones();
    await cargarUsuarios();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.cerrarPeriodo = cerrarPeriodo;

/* ---- añadir rol ---- */
function toggleAddRol() {
  const f = document.getElementById('add-rol-form');
  const abrir = f.style.display === 'none';
  f.style.display = abrir ? '' : 'none';
  if (abrir) renderCamposRol();
}
window.toggleAddRol = toggleAddRol;

const CAMPOS_ROL = {
  profesor: [
    { id: 'escalafon', label: 'Escalafón', type: 'text' },
    { id: 'carga_horaria', label: 'Carga horaria', type: 'number' },
    { id: 'codigo_investigador', label: 'Cód. investigador (opcional)', type: 'text' }
  ],
  administrativo: [
    { id: 'cargo', label: 'Cargo', type: 'text' },
    { id: 'horas_semanales', label: 'Horas semanales', type: 'number' },
    { id: 'unidad_adscripcion', label: 'Unidad de adscripción', type: 'text' }
  ],
  egresado: [
    { id: 'titulo', label: 'Título', type: 'text' },
    { id: 'indice_academico', label: 'Índice académico', type: 'number' },
    { id: 'ano_graduacion', label: 'Año de graduación', type: 'number' }
  ],
  estudiante: [
    { id: 'escuela', label: 'Escuela', type: 'text' },
    { id: 'facultad', label: 'Facultad', type: 'text' },
    { id: 'semestre', label: 'Semestre', type: 'number' },
    { id: 'uc_aprobadas', label: 'UC aprobadas', type: 'number' },
    { id: 'promedio', label: 'Promedio', type: 'number' }
  ]
};

function renderCamposRol() {
  const tipo = document.getElementById('add-rol-tipo').value;
  const campos = CAMPOS_ROL[tipo] || [];
  document.getElementById('add-rol-campos').innerHTML = campos.map(c =>
    '<div class="form-group" style="flex:1;min-width:140px;">' +
      '<label class="form-label">' + c.label + '</label>' +
      '<input class="form-input rol-campo" data-id="' + c.id + '" type="' + c.type + '"' +
        (c.type === 'number' ? ' step="any"' : '') + '>' +
    '</div>').join('');
}
window.renderCamposRol = renderCamposRol;

async function guardarRol() {
  const tipo = document.getElementById('add-rol-tipo').value;
  const body = { rol: tipo };
  document.querySelectorAll('#add-rol-campos .rol-campo').forEach(inp => {
    const v = inp.value.trim();
    if (v !== '') body[inp.getAttribute('data-id')] = v;
  });
  try {
    const r = await api('/admin/usuarios/' + VINC_CEDULA + '/vinculaciones', { method: 'POST', body });
    showToast(r.message || 'Rol agregado', 'success');
    document.getElementById('add-rol-form').style.display = 'none';
    await refrescarVinculaciones();
    await cargarUsuarios();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.guardarRol = guardarRol;

/* ================= TABLA VINCULACIONES ================= */
let VINC_PAGINA = 1;

function vincFiltrados() {
  const q = (document.getElementById('buscar-vinc').value || '').toLowerCase().trim();
  const sub = document.getElementById('filtro-subtipo').value;
  return TODOS_USUARIOS.filter(u => {
    const coincide = !q ||
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.cedula || '').toLowerCase().includes(q);
    let subOk = true;
    if (sub === '__sin__')      subOk = (u.roles_activos || []).length === 0;
    else if (sub)               subOk = (u.roles_activos || []).includes(sub);
    return coincide && subOk;
  });
}

function filtrarVinc() { VINC_PAGINA = 1; renderVinc(); }
window.filtrarVinc = filtrarVinc;

function renderVinc() {
  const lista = vincFiltrados();
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (VINC_PAGINA > totalPaginas) VINC_PAGINA = totalPaginas;
  const inicio = (VINC_PAGINA - 1) * POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + POR_PAGINA);

  const tbody = document.getElementById('vinc-tbody');
  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--space-5);">No se encontraron miembros.</td></tr>';
  } else {
    tbody.innerHTML = pagina.map(u => {
      const tieneRoles = (u.roles_activos || []).length > 0;
      const roles = tieneRoles
        ? u.roles_activos.map(r => '<span class="badge ' + (ROL_BADGE[r] || 'badge-gray') + '">' + r + '</span>').join(' ')
        : '<span class="badge badge-gray">Sin rol</span>';
      const periodo = tieneRoles
        ? '<span class="badge badge-success">Activo</span>'
        : '<span class="badge badge-gray">Sin período</span>';
      const nombreEsc = (u.nombre || '').replace(/'/g, "\\'");
      return '<tr>' +
        '<td class="font-mono text-sm">V-' + u.cedula + '</td>' +
        '<td><strong>' + (u.nombre || '—') + '</strong></td>' +
        '<td>' + roles + '</td>' +
        '<td>' + periodo + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-outline btn-sm vinc-action" title="Añadir rol" onclick="abrirVinculaciones(\'' + u.cedula + '\',\'' + nombreEsc + '\',true)">+</button>' +
            '<button class="btn btn-outline btn-sm vinc-action" title="Cerrar período activo" ' + (tieneRoles ? '' : 'disabled') +
              ' onclick="cerrarPeriodoFila(\'' + u.cedula + '\')">−</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  document.getElementById('vinc-info').textContent =
    total === 0 ? 'Sin resultados'
                : 'Mostrando ' + (inicio + 1) + '–' + Math.min(inicio + POR_PAGINA, total) + ' de ' + total + ' miembros';

  const ctr = document.getElementById('vinc-paginacion');
  let html = '<button class="page-btn" ' + (VINC_PAGINA <= 1 ? 'disabled' : '') + ' onclick="irPaginaVinc(' + (VINC_PAGINA - 1) + ')">‹</button>';
  for (let p = 1; p <= totalPaginas; p++)
    html += '<button class="page-btn ' + (p === VINC_PAGINA ? 'active' : '') + '" onclick="irPaginaVinc(' + p + ')">' + p + '</button>';
  html += '<button class="page-btn" ' + (VINC_PAGINA >= totalPaginas ? 'disabled' : '') + ' onclick="irPaginaVinc(' + (VINC_PAGINA + 1) + ')">›</button>';
  ctr.innerHTML = html;
}

function irPaginaVinc(p) { VINC_PAGINA = p; renderVinc(); }
window.irPaginaVinc = irPaginaVinc;

async function cerrarPeriodoFila(cedula) {
  if (!confirm('¿Cerrar el período de vinculación activo de este miembro?')) return;
  try {
    const r = await api('/admin/usuarios/' + cedula + '/vinculaciones/cerrar', { method: 'PATCH' });
    showToast(r.message || 'Período cerrado', 'success');
    await cargarUsuarios();   // refresca roles_activos en ambas tablas
    renderVinc();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.cerrarPeriodoFila = cerrarPeriodoFila;

/* ================= APROBACIONES ================= */
async function cargarAprobaciones() {
  const cont = document.getElementById('aprobaciones-lista');
  try {
    const data = await api('/admin/solicitudes/pendientes');
    const sols = data.solicitudes || [];
    document.getElementById('aprob-count').textContent = sols.length;
    const badge = document.getElementById('badge-aprob');
    if (sols.length) { badge.style.display = ''; badge.textContent = sols.length; }
    else badge.style.display = 'none';

    if (sols.length === 0) {
      cont.innerHTML = '<p style="color:var(--color-text-muted);">No hay trámites pendientes de aprobación.</p>';
      return;
    }
    cont.innerHTML = sols.map(s => {
      const btn = s.paso_pendiente_id
        ? '<button class="btn btn-primary btn-sm" onclick="aprobarPaso(\'' + s.id_solicitud + '\',\'' + s.paso_pendiente_id + '\')">' +
          'Aprobar paso: ' + (s.paso_pendiente_responsable || 'Revisar') + '</button>'
        : '<span class="text-sm text-secondary">Sin paso pendiente</span>';
      return '<div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border);">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">' +
          '<div>' +
            '<div style="font-weight:600;">' + (s.servicio || '—') + ' <span class="badge badge-gray" style="margin-left:6px;">' + (s.categoria || '') + '</span></div>' +
            '<div class="text-sm text-secondary">' + (s.solicitante || '—') + ' · V-' + s.cedula_solicitante + '</div>' +
            '<div class="text-sm text-muted" style="font-family:var(--font-mono);">' + s.id_solicitud + '</div>' +
          '</div>' +
          '<span class="badge badge-warning">' + s.pasos_completados + '/' + s.total_pasos + ' pasos</span>' +
        '</div>' +
        '<div style="margin-top:8px;">' + btn + '</div>' +
      '</div>';
    }).join('');
  } catch (err) {
    cont.innerHTML = '<p style="color:var(--color-danger);">' + err.message + '</p>';
  }
}

async function aprobarPaso(idSolicitud, idPaso) {
  if (!confirm('¿Confirmas la aprobación de este paso?')) return;
  try {
    const r = await api('/admin/solicitudes/' + idSolicitud + '/paso/' + idPaso, { method: 'PATCH', body: {} });
    showToast(r.completada ? 'Trámite completado — todos los pasos aprobados'
                           : 'Paso aprobado — el trámite avanzó', 'success');
    await cargarAprobaciones();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.aprobarPaso = aprobarPaso;

/* ═══════════════════════════════════════════════════════════════
   EMPRESAS EXTERNAS
   ═══════════════════════════════════════════════════════════════ */
let _empresas = [];

async function cargarVacantesAdmin() {
  await Promise.all([_cargarEmpresas(), _cargarVacantes()]);
}

async function _cargarEmpresas() {
  const tbody = document.getElementById('empresas-tbody');
  try {
    const data = await api('/admin/entidades-externas');
    _empresas = data.entidades || [];
    if (!_empresas.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--space-4);">No hay empresas registradas.</td></tr>';
      return;
    }
    tbody.innerHTML = _empresas.map(e =>
      '<tr>' +
        '<td class="font-mono text-sm">' + e.rif + '</td>' +
        '<td><strong>' + e.razon_social + '</strong></td>' +
        '<td>' + (e.contacto_nombre || '—') + '</td>' +
        '<td>' + (e.contacto_correo || '—') + '</td>' +
        '<td>' + (e.fecha_fin_contrato ? new Date(e.fecha_fin_contrato).toLocaleDateString('es-VE') : '—') + '</td>' +
      '</tr>'
    ).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--color-danger);padding:var(--space-4);">' + err.message + '</td></tr>';
  }
}
window.cargarVacantesAdmin = cargarVacantesAdmin;

function abrirModalEmpresa() {
  ['emp-rif', 'emp-razon', 'emp-contacto', 'emp-correo', 'emp-vigencia'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  openModal('modal-empresa');
}
window.abrirModalEmpresa = abrirModalEmpresa;

async function guardarEmpresa() {
  const rif      = document.getElementById('emp-rif').value.trim();
  const razon    = document.getElementById('emp-razon').value.trim();
  const contacto = document.getElementById('emp-contacto').value.trim();
  const correo   = document.getElementById('emp-correo').value.trim();
  const vigencia = document.getElementById('emp-vigencia').value;

  if (!rif || !razon || !contacto || !correo || !vigencia) {
    showToast('Complete todos los campos obligatorios', 'warning'); return;
  }
  try {
    await api('/admin/entidades-externas', {
      method: 'POST',
      body: { rif, razon_social: razon, contacto_nombre: contacto, contacto_correo: correo, fecha_fin_contrato: vigencia }
    });
    showToast('Empresa registrada', 'success');
    closeModal('modal-empresa');
    _cargarEmpresas();
  } catch (err) { showToast(err.message, 'error'); }
}
window.guardarEmpresa = guardarEmpresa;

/* ═══════════════════════════════════════════════════════════════
   VACANTES
   ═══════════════════════════════════════════════════════════════ */
async function _cargarVacantes() {
  const tbody = document.getElementById('vacantes-tbody');
  try {
    const data = await api('/admin/vacantes');
    const lista = data.vacantes || [];
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:var(--space-4);">No hay vacantes registradas.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(v => {
      const estatusBadge = v.estatus === 'Disponible' ? 'badge-success' : 'badge-warning';
      const idEsc = v.id_vacante.replace(/'/g, "\\'");
      const cargoEsc = (v.cargo || '').replace(/'/g, "\\'");
      const respEsc = (v.responsabilidades || '').replace(/'/g, "\\'");
      const perfilEsc = (v.perfil_buscado || '').replace(/'/g, "\\'");
      const benEsc = (v.beneficios || '').replace(/'/g, "\\'");
      return '<tr>' +
        '<td class="font-mono text-sm">' + v.id_vacante + '</td>' +
        '<td><strong>' + (v.cargo || '—') + '</strong></td>' +
        '<td>' + (v.empresa || '—') + '</td>' +
        '<td>' + (v.fecha_oferta ? new Date(v.fecha_oferta).toLocaleDateString('es-VE') : '—') + '</td>' +
        '<td><span class="badge ' + estatusBadge + '">' + v.estatus + '</span></td>' +
        '<td style="text-align:center;">' + (v.total_postulaciones || 0) + '</td>' +
        '<td style="white-space:nowrap;">' +
          '<button class="btn btn-outline btn-sm" style="margin-right:4px;" ' +
            'onclick="abrirModalEditarVacante(\'' + idEsc + '\',\'' + cargoEsc + '\',\'' + respEsc + '\',\'' + perfilEsc + '\',\'' + benEsc + '\',\'' + v.estatus + '\')">Editar</button>' +
          '<button class="btn btn-sm" style="background:var(--color-danger);color:#fff;" ' +
            'onclick="cerrarVacante(\'' + idEsc + '\')">Finalizar</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--color-danger);padding:var(--space-4);">' + err.message + '</td></tr>';
  }
}

async function abrirModalVacante() {
  ['vac-cargo', 'vac-responsabilidades', 'vac-perfil', 'vac-beneficios'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const sel = document.getElementById('vac-empresa');
  if (_empresas.length) {
    sel.innerHTML = '<option value="">Seleccionar empresa...</option>' +
      _empresas.map(e => '<option value="' + e.rif + '">' + e.razon_social + ' (' + e.rif + ')</option>').join('');
  } else {
    try {
      const data = await api('/admin/entidades-externas');
      _empresas = data.entidades || [];
      sel.innerHTML = '<option value="">Seleccionar empresa...</option>' +
        _empresas.map(e => '<option value="' + e.rif + '">' + e.razon_social + '</option>').join('');
    } catch (_) { sel.innerHTML = '<option value="">Error cargando empresas</option>'; }
  }
  openModal('modal-vacante');
}
window.abrirModalVacante = abrirModalVacante;

async function guardarVacante() {
  const rif   = document.getElementById('vac-empresa').value;
  const cargo = document.getElementById('vac-cargo').value.trim();
  const resp  = document.getElementById('vac-responsabilidades').value.trim();
  const perf  = document.getElementById('vac-perfil').value.trim();
  const ben   = document.getElementById('vac-beneficios').value.trim();

  if (!rif || !cargo || !resp || !perf) { showToast('Complete los campos obligatorios', 'warning'); return; }
  try {
    await api('/admin/vacantes', {
      method: 'POST',
      body: { cargo, responsabilidades: resp, perfil_buscado: perf, beneficios: ben || null, rif }
    });
    showToast('Vacante creada', 'success');
    closeModal('modal-vacante');
    _cargarVacantes();
  } catch (err) { showToast(err.message, 'error'); }
}
window.guardarVacante = guardarVacante;

function abrirModalEditarVacante(id, cargo, resp, perfil, ben, estatus) {
  document.getElementById('edit-vac-id').value       = id;
  document.getElementById('edit-vac-cargo').value    = cargo;
  document.getElementById('edit-vac-resp').value     = resp;
  document.getElementById('edit-vac-perfil').value   = perfil;
  document.getElementById('edit-vac-beneficios').value = ben;
  document.getElementById('edit-vac-estatus').value  = estatus;
  openModal('modal-editar-vacante');
}
window.abrirModalEditarVacante = abrirModalEditarVacante;

async function actualizarVacante() {
  const id = document.getElementById('edit-vac-id').value;
  try {
    await api('/admin/vacantes/' + encodeURIComponent(id), {
      method: 'PUT',
      body: {
        cargo:            document.getElementById('edit-vac-cargo').value.trim(),
        responsabilidades: document.getElementById('edit-vac-resp').value.trim(),
        perfil_buscado:   document.getElementById('edit-vac-perfil').value.trim(),
        beneficios:       document.getElementById('edit-vac-beneficios').value.trim(),
        estatus:          document.getElementById('edit-vac-estatus').value
      }
    });
    showToast('Vacante actualizada', 'success');
    closeModal('modal-editar-vacante');
    _cargarVacantes();
  } catch (err) { showToast(err.message, 'error'); }
}
window.actualizarVacante = actualizarVacante;

async function cerrarVacante(id) {
  if (!confirm('¿Marcar esta vacante como Finalizada?')) return;
  try {
    await api('/admin/vacantes/' + encodeURIComponent(id), { method: 'DELETE' });
    showToast('Vacante finalizada', 'success');
    _cargarVacantes();
  } catch (err) { showToast(err.message, 'error'); }
}
window.cerrarVacante = cerrarVacante;

/* ═══════════════════════════════════════════════════════════════
   TASAS DE CAMBIO
   ═══════════════════════════════════════════════════════════════ */
async function cargarTasas() {
  const tbody  = document.getElementById('tasas-tbody');
  const vigDiv = document.getElementById('tasa-vigente');
  try {
    const data = await api('/admin/tasas');
    const lista = data.tasas || [];

    if (lista.length) {
      const v = lista[0];
      vigDiv.innerHTML =
        '<strong>Tasa vigente (' + new Date(v.fecha_tasa).toLocaleDateString('es-VE') + '):</strong>' +
        '&nbsp;&nbsp;1 EUR = <strong>' + Number(v.eur).toFixed(2) + ' Bs.</strong>' +
        '&nbsp;&nbsp;|&nbsp;&nbsp;1 USD = <strong>' + Number(v.usd).toFixed(2) + ' Bs.</strong>';
    } else {
      vigDiv.innerHTML = '<span style="color:var(--color-text-muted);">No hay tasas registradas.</span>';
    }

    tbody.innerHTML = lista.map(t =>
      '<tr>' +
        '<td>' + new Date(t.fecha_tasa).toLocaleDateString('es-VE') + '</td>' +
        '<td>' + Number(t.eur).toFixed(2) + '</td>' +
        '<td>' + Number(t.usd).toFixed(2) + '</td>' +
      '</tr>'
    ).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:var(--space-4);">Sin registros.</td></tr>';
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--color-danger);">' + err.message + '</td></tr>';
  }
}
window.cargarTasas = cargarTasas;

function abrirModalTasa() {
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('tasa-fecha').value = hoy;
  document.getElementById('tasa-eur').value = '';
  document.getElementById('tasa-usd').value = '';
  openModal('modal-tasa');
}
window.abrirModalTasa = abrirModalTasa;

async function guardarTasa() {
  const fecha = document.getElementById('tasa-fecha').value;
  const eur   = parseFloat(document.getElementById('tasa-eur').value);
  const usd   = parseFloat(document.getElementById('tasa-usd').value);

  if (!fecha || isNaN(eur) || eur <= 0 || isNaN(usd) || usd <= 0) {
    showToast('Complete todos los campos con valores positivos', 'warning'); return;
  }
  try {
    await api('/admin/tasas', { method: 'POST', body: { fecha_tasa: fecha, eur, usd } });
    showToast('Tasa registrada / actualizada', 'success');
    closeModal('modal-tasa');
    cargarTasas();
  } catch (err) { showToast(err.message, 'error'); }
}
window.guardarTasa = guardarTasa;

/* ═══════════════════════════════════════════════════════════════
   CATÁLOGO DE ACREDITACIONES (ADMIN)
   ═══════════════════════════════════════════════════════════════ */
async function cargarAcredAdmin() {
  const tbody = document.getElementById('acred-admin-tbody');
  try {
    const data = await api('/admin/acreditaciones');
    const lista = data.acreditaciones || [];
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:var(--space-4);">Sin acreditaciones en catálogo.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(a => {
      const idEsc = a.id_acreditacion.replace(/'/g, "\\'");
      return '<tr>' +
        '<td class="font-mono text-sm">' + a.id_acreditacion + '</td>' +
        '<td><span class="badge badge-info">' + a.tipo + '</span></td>' +
        '<td>' + (a.descripcion || '—') + '</td>' +
        '<td><button class="btn btn-sm" style="background:var(--color-danger);color:#fff;" ' +
          'onclick="eliminarAcredAdmin(\'' + idEsc + '\')">Eliminar</button></td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--color-danger);">' + err.message + '</td></tr>';
  }
}
window.cargarAcredAdmin = cargarAcredAdmin;

function abrirModalAcredAdmin() {
  document.getElementById('acred-admin-tipo').value = 'Certificación';
  document.getElementById('acred-admin-desc').value = '';
  openModal('modal-acred-admin');
}
window.abrirModalAcredAdmin = abrirModalAcredAdmin;

async function guardarAcredAdmin() {
  const tipo = document.getElementById('acred-admin-tipo').value;
  const desc = document.getElementById('acred-admin-desc').value.trim();
  if (!tipo) { showToast('Seleccione un tipo', 'warning'); return; }
  try {
    await api('/admin/acreditaciones', { method: 'POST', body: { tipo, descripcion: desc || null } });
    showToast('Acreditación creada en catálogo', 'success');
    closeModal('modal-acred-admin');
    cargarAcredAdmin();
  } catch (err) { showToast(err.message, 'error'); }
}
window.guardarAcredAdmin = guardarAcredAdmin;

async function eliminarAcredAdmin(id) {
  if (!confirm('¿Eliminar esta acreditación del catálogo?')) return;
  try {
    await api('/admin/acreditaciones/' + encodeURIComponent(id), { method: 'DELETE' });
    showToast('Acreditación eliminada', 'success');
    cargarAcredAdmin();
  } catch (err) { showToast(err.message, 'error'); }
}
window.eliminarAcredAdmin = eliminarAcredAdmin;

/* ═══════════════════════════════════════════════════════════════
   CIERRE MASIVO DE FOLIOS
   ═══════════════════════════════════════════════════════════════ */
async function ejecutarCierreMasivo() {
  if (!confirm('¿Está seguro de ejecutar el cierre masivo de folios? Esta operación no se puede deshacer.')) return;
  const res = document.getElementById('cierre-resultado');
  res.innerHTML = '<p style="color:var(--color-text-muted);">Ejecutando...</p>';
  try {
    await api('/admin/folios/cierre-masivo', { method: 'POST' });
    res.innerHTML = '<p style="color:var(--color-success);font-weight:600;">✓ Cierre masivo ejecutado correctamente.</p>';
  } catch (err) {
    res.innerHTML = '<p style="color:var(--color-danger);">✗ ' + err.message + '</p>';
  }
}
window.ejecutarCierreMasivo = ejecutarCierreMasivo;
