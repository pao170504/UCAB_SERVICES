/* dashboard.js */
var _VIEWS = ['view-estudiante', 'view-profesor', 'view-administrativo'];

window.renderForRole = function (role) {
  var map = {
    estudiante:     'view-estudiante',
    egresado:       'view-estudiante',
    profesor:       'view-profesor',
    administrativo: 'view-administrativo'
  };
  var targetId = map[role] || 'view-estudiante';
  _VIEWS.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = (id === targetId) ? '' : 'none';
  });
  if ((role === 'estudiante' || role === 'egresado') && document.getElementById('audit-table'))
    makeTableSortable('audit-table');
};

/* ---- Security card (shared) ---- */
function _securityCard() {
  return '<div class="kpi-card">' +
    '<div class="kpi-label">ESTADO DE SEGURIDAD <span>🛡</span></div>' +
    '<div class="security-row"><span class="dot dot-success"></span> 📱 Protegido por MFA</div>' +
    '<div class="security-row text-sm text-secondary">Último cambio: Hace 2 días</div>' +
    '<div style="margin-top:var(--space-3);">' +
      '<button class="btn btn-secondary btn-sm" onclick="openModal(\'mfa-modal\')">Gestionar</button>' +
    '</div>' +
  '</div>';
}

/* ---- Replace .kpi-row in a view section ---- */
function _replaceKpiRow(view, html) {
  if (!view) return;
  var row = view.querySelector('.kpi-row');
  if (row) row.outerHTML = html;
}

/* ---- Role renderers ---- */
function renderEstudiante(data, view) {
  if (!data) return;
  var promedio   = parseFloat(data.promedio)    || 0;
  var uc         = data.uc_aprobadas            || 0;
  var semestre   = data.semestre                || '?';
  var facultad   = data.facultad                || '';
  var beca       = data.beca                    || null;
  var preparador = data.preparador              || null;

  var promBadge = promedio >= 17 ? '<span class="stat-trend up">↗ Top 5%</span>'  :
                  promedio >= 15 ? '<span class="stat-trend up">↗ Top 20%</span>' : '';

  var card1 =
    '<div class="kpi-card">' +
      '<div class="kpi-label">PROMEDIO ' + promBadge + '</div>' +
      '<div class="kpi-value">' + promedio.toFixed(2) + '</div>' +
      '<p class="kpi-sub">Facultad de ' + facultad + '</p>' +
      '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' +
        ((promedio / 20) * 100).toFixed(0) + '%"></div></div>' +
    '</div>';

  var becaBadge = beca
    ? '<span class="badge badge-success">Beca: ' + beca.estatus.toUpperCase() + ' (' + beca.indice + ')</span>'
    : '';
  var card2 =
    '<div class="kpi-card">' +
      '<div class="kpi-label">UNIDADES DE CRÉDITO (UC) <span>✓</span></div>' +
      '<div class="kpi-value" style="font-size:1.8rem;">' + uc +
        ' <span style="font-size:1rem;color:var(--color-text-muted);">/ 180 UC</span></div>' +
      '<div class="kpi-tags"><span class="tag">Semestre: ' + semestre + 'vo</span>' + becaBadge + '</div>' +
    '</div>';

  var becaCard = beca
    ? '<div class="kpi-card" style="border-left:4px solid var(--color-blue);">' +
        '<div class="kpi-label">MI BECA</div>' +
        '<div style="margin-bottom:var(--space-2);"><span class="badge badge-blue">' + beca.tipo + '</span></div>' +
        '<div style="font-size:.82rem;color:var(--color-text-secondary);margin-bottom:var(--space-2);">' +
          'Índice mantenimiento: <strong>' + parseFloat(beca.indice).toFixed(2) + '</strong> / requerido: 14.00' +
        '</div>' +
        '<div class="progress-bar-wrap"><div class="progress-bar-fill success" style="width:' +
          ((parseFloat(beca.indice) / 20) * 100).toFixed(0) + '%"></div></div>' +
        '<div style="margin-top:var(--space-2);">' +
          (beca.estatus === 'Activa'
            ? '<span class="badge badge-success">BENEFICIO ACTIVO</span>'
            : '<span class="badge badge-warning">' + beca.estatus.toUpperCase() + '</span>') +
        '</div>' +
      '</div>'
    : '';

  _replaceKpiRow(view,
    '<div class="kpi-row" style="grid-template-columns:repeat(' + (beca ? 4 : 3) + ',1fr);">' +
      card1 + card2 + _securityCard() + becaCard +
    '</div>'
  );

  if (data.preparador) {
    const prepSection = document.getElementById('preparador-section');
    if (prepSection) {
      prepSection.style.display = '';
      prepSection.innerHTML = `
        <div class="card">
          <div class="card-body" style="padding:var(--space-4)">
            <span class="card-eyebrow">MI PREPARADURÍA</span>
            <div style="display:flex; align-items:center;
                        gap:var(--space-3); margin-top:var(--space-3)">
              <span style="font-size:1.4rem">📚</span>
              <div>
                <p style="font-weight:600; font-size:0.95rem; margin:0">
                  ${data.preparador.asignatura}
                </p>
                <p style="color:var(--color-text-secondary);
                          font-size:0.82rem; margin:2px 0 0 0">
                  Horas asignadas: ${data.preparador.horas} hrs
                </p>
              </div>
            </div>
          </div>
        </div>`;
    }
  } else {
    const prepSection = document.getElementById('preparador-section');
    if (prepSection) prepSection.style.display = 'none';
  }
}

function renderEgresado(data, view) {
  if (!data) return;
  var titulo = data.titulo             || 'Título universitario';
  var ano    = data.ano_graduacion     || '';
  var indice = parseFloat(data.indice_academico) || 0;

  var badge = indice >= 17 ? 'DISTINCIÓN' : indice >= 15 ? 'MUY BUENO' : 'APROBADO';

  var card1 =
    '<div class="kpi-card">' +
      '<div class="kpi-label">TÍTULO OBTENIDO</div>' +
      '<div class="kpi-value" style="font-size:1.2rem;">' + titulo + '</div>' +
      '<p class="kpi-sub">Año de graduación: ' + ano + '</p>' +
    '</div>';

  var card2 =
    '<div class="kpi-card">' +
      '<div class="kpi-label">ÍNDICE ACADÉMICO FINAL ' +
        '<span class="badge badge-navy" style="margin-left:4px;">' + badge + '</span></div>' +
      '<div class="kpi-value">' + indice.toFixed(2) + '</div>' +
      '<p class="kpi-sub">Índice al momento de graduación</p>' +
      '<div class="progress-bar-wrap"><div class="progress-bar-fill success" style="width:' +
        ((indice / 20) * 100).toFixed(0) + '%"></div></div>' +
    '</div>';

  _replaceKpiRow(view,
    '<div class="kpi-row" style="grid-template-columns:repeat(3,1fr);">' +
      card1 + card2 + _securityCard() +
    '</div>'
  );

  const prepSectionEg = document.getElementById('preparador-section');
  if (prepSectionEg) prepSectionEg.style.display = 'none';

  /* CTA banner (idempotent) */
  if (!document.getElementById('cta-bolsa-egresado') && view) {
    var newRow = view.querySelector('.kpi-row');
    if (newRow) {
      var cta = document.createElement('div');
      cta.id = 'cta-bolsa-egresado';
      cta.style.cssText = 'background:var(--color-navy);border-radius:var(--radius-md);' +
        'padding:var(--space-5);margin-bottom:var(--space-5);' +
        'display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);';
      cta.innerHTML =
        '<div>' +
          '<h3 style="color:white;margin:0 0 var(--space-2);font-size:1.1rem;">🎓 Explora la Bolsa de Trabajo</h3>' +
          '<p style="color:rgba(255,255,255,.65);font-size:.875rem;margin:0;">' +
            'Tienes acceso completo a las vacantes publicadas por aliados UCAB.</p>' +
        '</div>' +
        '<a href="carrera.html" class="btn btn-primary">Ver vacantes →</a>';
      newRow.insertAdjacentElement('afterend', cta);
    }
  }
}

function renderProfesor(data, view) {
  if (!data) return;
  var escalafon = data.escalafon                            || '—';
  var carga     = data.carga_horaria || data.cargaHoraria   || '—';
  var codInv    = data.codigo_investigador || data.codigoInvestigador || null;

  var card3 = codInv
    ? '<div class="kpi-card" style="border-left:4px solid var(--color-blue);">' +
        '<div class="kpi-label">INVESTIGADOR ACTIVO</div>' +
        '<div class="kpi-value" style="font-size:1.2rem;font-family:var(--font-mono);">' + codInv + '</div>' +
        '<div style="margin-top:var(--space-2);"><span class="badge badge-navy">Decanato Investigación</span></div>' +
      '</div>'
    : '<div class="kpi-card">' +
        '<div class="kpi-label" style="color:var(--color-text-muted);">CÓDIGO INVESTIGADOR</div>' +
        '<div class="kpi-value" style="font-size:1.4rem;color:var(--color-text-muted);">No aplica</div>' +
        '<p class="kpi-sub">No registrado como investigador activo</p>' +
      '</div>';

  _replaceKpiRow(view,
    '<div class="kpi-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:var(--space-5);">' +
      '<div class="kpi-card">' +
        '<div class="kpi-label">ESCALAFÓN</div>' +
        '<div class="kpi-value" style="font-size:1.6rem;">' + escalafon + '</div>' +
        '<div class="kpi-sub">Docente activo</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-label">CARGA HORARIA</div>' +
        '<div class="kpi-value" style="font-size:1.6rem;">' + carga + ' <span class="stat-unit">hrs/sem</span></div>' +
        '<div class="kpi-sub">Carga semanal asignada</div>' +
      '</div>' +
      card3 + _securityCard() +
    '</div>'
  );
  const prepSectionProf = document.getElementById('preparador-section');
  if (prepSectionProf) prepSectionProf.style.display = 'none';
}

function renderAdministrativo(data, view) {
  if (!data) return;
  var cargo  = data.cargo                                       || '—';
  var horas  = data.horas_semanales  || data.horasSemanales    || '—';
  var unidad = data.unidad_adscripcion || data.unidadAdscripcion || '—';

  _replaceKpiRow(view,
    '<div class="kpi-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--space-5);">' +
      '<div class="kpi-card">' +
        '<div class="kpi-label">CARGO</div>' +
        '<div class="kpi-value" style="font-size:1.4rem;">' + cargo + '</div>' +
        '<div class="kpi-sub">' + unidad + '</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-label">CARGA HORARIA</div>' +
        '<div class="kpi-value" style="font-size:1.6rem;">' + horas + ' <span class="stat-unit">hrs/sem</span></div>' +
        '<div class="kpi-sub">Tiempo completo</div>' +
      '</div>' +
      _securityCard() +
    '</div>'
  );
  const prepSectionAdmin = document.getElementById('preparador-section');
  if (prepSectionAdmin) prepSectionAdmin.style.display = 'none';

  /* Quick actions (idempotent) */
  if (!document.getElementById('quick-actions-admin') && view) {
    var newRow = view.querySelector('.kpi-row');
    if (newRow) {
      var qa = document.createElement('div');
      qa.id = 'quick-actions-admin';
      qa.style.cssText = 'display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap;';
      qa.innerHTML =
        '<a href="servicios.html" class="btn btn-secondary">📋 Nuevo Trámite</a>' +
        '<a href="infraestructura.html" class="btn btn-secondary">📅 Gestionar Espacios</a>' +
        '<a href="reportes/index.html" class="btn btn-secondary">📊 Ver Reportes</a>';
      newRow.insertAdjacentElement('afterend', qa);
    }
  }

  cargarTramitesPendientesAdmin();
}

/* ---- Admin: load pending tramites ---- */
async function cargarTramitesPendientesAdmin() {
  // Solo el admin del sistema ve/usa el panel de aprobación de trámites.
  var _cont = document.getElementById('admin-tramites-pendientes');
  if (!esAdminSistema()) {
    if (_cont) { var _card = _cont.closest('.card'); (_card || _cont).style.display = 'none'; }
    return;
  }
  if (_cont) { var _c2 = _cont.closest('.card'); if (_c2) _c2.style.display = ''; }
  var sid = sessionStorage.getItem('sessionID');
  try {
    var r    = await fetch('/api/admin/solicitudes/pendientes', {
      headers: { 'Authorization': 'Bearer ' + sid }
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error');
    var solicitudes = data.solicitudes || [];
    var container   = document.getElementById('admin-tramites-pendientes');
    if (!container) return;
    if (solicitudes.length === 0) {
      container.innerHTML = '<p style="color:var(--color-text-muted)">No hay trámites pendientes de aprobación.</p>';
      return;
    }
    container.innerHTML = solicitudes.map(function (s) {
      var btnAprobar = s.paso_pendiente_id
        ? '<button class="btn btn-primary btn-sm" style="margin-top:8px" ' +
          'onclick="aprobarPasoDesdePanel(\'' + s.id_solicitud + '\',\'' + s.paso_pendiente_id + '\')">' +
          'Aprobar paso (' + (s.paso_pendiente_responsable || 'Revisar') + ')</button>'
        : '<span style="font-size:.82rem;color:var(--color-text-muted)">Sin paso pendiente</span>';
      return '<div style="padding:var(--space-3);border-bottom:1px solid var(--color-border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px">' +
          '<span style="font-weight:600;font-size:.9rem">' + s.servicio + '</span>' +
          '<span class="badge badge-warning">' + s.pasos_completados + '/' + s.total_pasos + ' pasos</span>' +
        '</div>' +
        '<div style="font-size:.8rem;color:var(--color-text-secondary);margin:2px 0">' +
          s.solicitante + ' · ' + s.cedula_solicitante +
        '</div>' +
        '<div style="font-size:.78rem;color:var(--color-text-muted)">Solicitud: ' + s.id_solicitud + '</div>' +
        btnAprobar +
      '</div>';
    }).join('');
  } catch (err) {
    console.warn('No se pudieron cargar trámites:', err.message);
  }
}

window.aprobarPasoDesdePanel = async function (idSolicitud, idPaso) {
  if (!confirm('¿Confirmas la aprobación de este paso?')) return;
  var sid = sessionStorage.getItem('sessionID');
  try {
    var r = await fetch('/api/admin/solicitudes/' + idSolicitud + '/paso/' + idPaso, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + sid,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({})
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error');
    showToast(
      data.completada
        ? 'Trámite completado — todos los pasos aprobados'
        : 'Paso aprobado — trámite avanzó al siguiente paso',
      'success'
    );
    await cargarTramitesPendientesAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/* ---- Trámites recientes desde BD ---- */
async function cargarTramitesRecientes() {
  var cont = document.getElementById('tramites-recientes-container');
  if (!cont) return;

  var sid = sessionStorage.getItem('sessionID');
  try {
    var r    = await fetch('/api/perfil/tramites', {
      headers: { 'Authorization': 'Bearer ' + sid }
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error');

    var tramites = data.tramites || [];
    if (!tramites.length) {
      cont.innerHTML = '<p style="padding:var(--space-4);color:var(--color-text-muted);">No tienes trámites registrados.</p>';
      return;
    }

    var BADGE = {
      'Completada': 'badge-success',
      'En Proceso': 'badge-info',
      'Pendiente':  'badge-warning',
      'Cancelada':  'badge-danger'
    };

    var filas = tramites.map(function (t) {
      var fecha = new Date(t.fecha_apertura).toLocaleDateString('es-VE');
      var badge = BADGE[t.estado] || 'badge-info';
      var btn   = t.estado === 'Completada'
        ? '<a href="pagos.html" class="btn btn-outline btn-sm">Ver factura</a>'
        : '<a href="servicios.html" class="btn btn-outline btn-sm">Ver estado</a>';
      return '<tr>' +
        '<td class="font-mono text-sm">' + t.id_solicitud + '</td>' +
        '<td><strong>' + t.tramite + '</strong></td>' +
        '<td>' + fecha + '</td>' +
        '<td><span class="badge ' + badge + '">' + t.estado + '</span></td>' +
        '<td>' + btn + '</td>' +
        '</tr>';
    }).join('');

    cont.innerHTML =
      '<div class="table-wrap" style="border:none;border-radius:0;">' +
        '<table class="table">' +
          '<thead><tr><th>N° SOLICITUD</th><th>TRÁMITE</th><th>FECHA</th><th>ESTADO</th><th></th></tr></thead>' +
          '<tbody>' + filas + '</tbody>' +
        '</table>' +
      '</div>';
  } catch (err) {
    cont.innerHTML = '<p style="padding:var(--space-4);color:var(--color-text-muted);">No se pudieron cargar los trámites.</p>';
  }
}

/* ---- Main render orchestrator ---- */
function renderPanel() {
  var usuario = getUsuario();
  if (!usuario) return;

  var rol = sessionStorage.getItem('rolActivo') || (usuario.roles[0] ? usuario.roles[0].rol : null);
  if (!rol) return;

  var rolData = getRolData(rol);

  window.renderForRole(rol);

  var viewId = { estudiante: 'view-estudiante', egresado: 'view-estudiante',
                 profesor: 'view-profesor', administrativo: 'view-administrativo' }[rol] || 'view-estudiante';
  var view = document.getElementById(viewId);

  /* Update greeting in the active view's page-header-title */
  var titleEl = view ? view.querySelector('.page-header-title') : null;
  if (titleEl) titleEl.textContent = '¡Bienvenido/a, ' + usuario.nombre.split(' ')[0] + '!';

  if      (rol === 'estudiante')     renderEstudiante(rolData, view);
  else if (rol === 'egresado')       renderEgresado(rolData, view);
  else if (rol === 'profesor')       renderProfesor(rolData, view);
  else if (rol === 'administrativo') renderAdministrativo(rolData, view);

  cargarSesiones();
  cargarTramitesRecientes();
}

/* ---- Session history ---- */
async function cargarSesiones() {
  var sessionID = sessionStorage.getItem('sessionID');
  try {
    var res  = await fetch('/api/perfil/sesiones', {
      headers: { 'Authorization': 'Bearer ' + sessionID }
    });
    var data = await res.json();
    renderSesiones(data.sesiones || []);
  } catch (err) {
    console.warn('No se pudo cargar el historial de sesiones:', err);
    renderSesiones([]);
  }
}

function renderSesiones(sesiones) {
  const tbody = document.getElementById('sesiones-tbody');
  if (!tbody) return;

  if (sesiones.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4"
          style="text-align:center; color:var(--color-text-muted); padding:var(--space-6)">
          Sin historial de sesiones registrado
        </td>
      </tr>`;
    return;
  }

  const usuario   = getUsuario();
  const currentID = sessionStorage.getItem('sessionID');

  tbody.innerHTML = sesiones.map(s => `
    <tr>
      <td>
        <div style="font-weight:500">
          ${s.uuid === currentID
            ? (usuario?.deviceName || 'Este dispositivo')
            : 'Otro dispositivo'}
          ${s.uuid === currentID
            ? '<span class="badge badge-success" style="font-size:0.7rem;margin-left:6px">Actual</span>'
            : ''}
        </div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);font-family:monospace">
          ${s.uuid.substring(0, 8)}...
        </div>
      </td>
      <td style="font-family:monospace; font-size:0.85rem">
        ${s.ip}
      </td>
      <td style="font-size:0.85rem">
        ${s.ubicacion}
      </td>
      <td style="font-size:0.85rem; color:var(--color-text-secondary)">
        ${s.tiempoAtras}
      </td>
    </tr>
  `).join('');
}

/* ---- Misc helpers ---- */

/* Recarga los datos del usuario (roles, índices, etc.) desde la BD y refresca el
   sessionStorage, para que los cambios del admin se vean sin re-login. */
async function refrescarUsuarioYRender() {
  var sessionID = sessionStorage.getItem('sessionID');
  if (!sessionID) return;
  try {
    var res = await fetch('/api/perfil/me', { headers: { 'Authorization': 'Bearer ' + sessionID } });
    if (!res.ok) return;
    var data = await res.json();
    if (!data || !data.usuario) return;
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));

    /* Si el rol activo guardado ya no existe en los roles frescos, reajustar */
    var rolActivo = sessionStorage.getItem('rolActivo');
    var roles = data.usuario.roles || [];
    if (!rolActivo || !roles.some(function (r) { return r.rol === rolActivo; })) {
      rolActivo = roles[0] ? roles[0].rol : null;
      if (rolActivo) sessionStorage.setItem('rolActivo', rolActivo);
    }
    if (typeof window.activarRol === 'function' && rolActivo) window.activarRol(rolActivo);
    renderPanel();
  } catch (e) {
    /* si falla, se queda con lo cacheado */
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('audit-table')) makeTableSortable('audit-table');
  renderPanel();
  refrescarUsuarioYRender();              // refresca con datos frescos de la BD
  document.addEventListener('roleChanged', function () { renderPanel(); });
});
