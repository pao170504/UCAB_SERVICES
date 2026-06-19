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
  if (role === 'profesor' && document.getElementById('courses-table'))
    makeTableSortable('courses-table');
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

  var prepCard = view ? view.querySelector('.preparador-card') : null;
  if (prepCard) {
    if (preparador) {
      prepCard.style.display = '';
      var lines = prepCard.querySelectorAll('p');
      if (lines[0]) lines[0].textContent = preparador.asignatura;
      if (lines[1]) lines[1].textContent = preparador.horas + ' horas asignadas';
    } else {
      prepCard.style.display = 'none';
    }
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

  var prepCard = view ? view.querySelector('.preparador-card') : null;
  if (prepCard) prepCard.style.display = 'none';

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
}

/* ---- Misc helpers ---- */
function openStudentModal(courseName) {
  var titleEl = document.getElementById('modal-estudiantes-title');
  if (titleEl) titleEl.textContent = 'Estudiantes — ' + courseName;
  openModal('modal-estudiantes');
}
window.openStudentModal = openStudentModal;

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('audit-table')) makeTableSortable('audit-table');
  renderPanel();
  document.addEventListener('roleChanged', function () { renderPanel(); });
});
