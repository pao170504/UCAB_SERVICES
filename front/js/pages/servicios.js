/* servicios.js */
var _catalog    = [];
var _categorias = [];
var _solData    = [];
var _adminMode  = false;

var _filtro = { categoria: 'all', buscar: '' };

var _solModal     = { servicio: null, step: 1, acompanantes: [] };
var _adminSvcData = null;

/* ── Auth helpers ────────────────────────────────────────────────────────── */
function _authHeaders() {
  var sid = sessionStorage.getItem('sessionID') || '';
  return { 'Authorization': 'Bearer ' + sid };
}

function _authJsonHeaders() {
  var sid = sessionStorage.getItem('sessionID') || '';
  return { 'Authorization': 'Bearer ' + sid, 'Content-Type': 'application/json' };
}

/* ── Category icon / badge maps ─────────────────────────────────────────── */
var _CAT_ICON = {
  salud:      '🏥',
  educacion:  '📚',
  cultura:    '🎭',
  deporte:    '⚽',
  'default':  '⚡'
};
var _CAT_BADGE = {
  salud:      'badge-success',
  educacion:  'badge-blue',
  cultura:    'badge-purple',
  deporte:    'badge-teal',
  'default':  'badge-gray'
};

function _catKey(cat) {
  return (cat || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
function _catIcon(cat)  { return _CAT_ICON[_catKey(cat)]  || _CAT_ICON['default']; }
function _catBadge(cat) { return _CAT_BADGE[_catKey(cat)] || _CAT_BADGE['default']; }

var _SOL_ESTADO = {
  'Pendiente':  { cls: 'badge-warning', label: 'Pendiente'  },
  'En Proceso': { cls: 'badge-info',    label: 'En Proceso' },
  'Completada': { cls: 'badge-success', label: 'Completada' },
  'Cancelada':  { cls: 'badge-danger',  label: 'Cancelada'  },
  'default':    { cls: 'badge-gray',    label: '—'          }
};

/* ── Init ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      _filtro.buscar = this.value.trim().toLowerCase();
      _renderCards();
    });
  }

  makeTableSortable('solicitudes-table');
  makeTableSearchable('solicitudes-table', 'sol-search');

  document.addEventListener('roleChanged', function (e) {
    _adminMode = e.detail.rol === 'administrativo';
    var btn = document.getElementById('btn-nuevo-servicio');
    if (btn) btn.style.display = _adminMode ? '' : 'none';
    _renderCards();
  });

  cargarCatalogo();
  cargarSolicitudes();
});

window.renderForRole = function (rol) {
  _adminMode = rol === 'administrativo';
  var btn = document.getElementById('btn-nuevo-servicio');
  if (btn) btn.style.display = _adminMode ? '' : 'none';
  _renderCards();
};

/* ── Catalog load ────────────────────────────────────────────────────────── */
function cargarCatalogo() {
  document.getElementById('cards-loading').style.display = '';
  document.getElementById('service-cards').style.display = 'none';
  document.getElementById('cards-empty').style.display   = 'none';

  fetch('/api/servicios/categorias', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _categorias = data.categorias || [];
      _renderCategoryTabs();
      return fetch('/api/servicios', { headers: _authHeaders() });
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _catalog = data.servicios || [];
      document.getElementById('cards-loading').style.display = 'none';
      _renderCards();
    })
    .catch(function () {
      document.getElementById('cards-loading').style.display = 'none';
      document.getElementById('cards-empty').style.display   = '';
      showToast('Error al cargar el catálogo de servicios', 'error');
    });
}

function _renderCategoryTabs() {
  var container = document.getElementById('tab-pills-container');
  if (!container) return;
  var seen = {};
  var html = '<button class="tab-pill active" data-category="all">Todo</button>';
  _categorias.forEach(function (cat) {
    var key = _catKey(cat.categoria);
    if (seen[key]) return;
    seen[key] = true;
    html += '<button class="tab-pill" data-category="' + key + '">' +
            _catIcon(cat.categoria) + ' ' + cat.nombre + '</button>';
  });
  container.innerHTML = html;

  container.querySelectorAll('.tab-pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      container.querySelectorAll('.tab-pill').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      _filtro.categoria = btn.dataset.category;
      _renderCards();
    });
  });
}

/* ── Card grid rendering ─────────────────────────────────────────────────── */
function _renderCards() {
  var grid  = document.getElementById('service-cards');
  var empty = document.getElementById('cards-empty');
  if (!grid) return;

  var visible = _catalog.filter(function (s) {
    var catMatch = _filtro.categoria === 'all' ||
                   _catKey(s.categoria) === _filtro.categoria;
    var txt      = _filtro.buscar;
    var txtMatch = !txt ||
                   (s.descripcion    || '').toLowerCase().includes(txt) ||
                   (s.nombre_entidad || '').toLowerCase().includes(txt) ||
                   (s.nombre_categoria || '').toLowerCase().includes(txt);
    return catMatch && txtMatch;
  });

  if (visible.length === 0) {
    grid.style.display  = 'none';
    empty.style.display = '';
    return;
  }

  grid.style.display  = '';
  empty.style.display = 'none';
  grid.innerHTML = visible.map(_buildCard).join('');
}

function _buildCard(s) {
  var icon     = _catIcon(s.categoria);
  var badgeCls = _catBadge(s.categoria);
  var tipoBadge = s.tipo_entidad === 'interna'
    ? '<span class="badge badge-navy">UCAB</span>'
    : '<span class="badge badge-amber">ALIADO</span>';

  var priceHtml = '';
  if (s.costo_min !== null && s.costo_min !== undefined) {
    var min = '$' + parseFloat(s.costo_min).toFixed(2);
    var max = s.costo_max !== null ? '$' + parseFloat(s.costo_max).toFixed(2) : '—';
    priceHtml = '<div class="service-card-tariff"><span>Rango tarifa: <strong>' + min + ' – ' + max + '</strong></span></div>';
  }

  var acredHtml = '';
  if (s.acreditaciones && s.acreditaciones.length > 0) {
    acredHtml = '<div class="service-acred-list">';
    s.acreditaciones.forEach(function (a) {
      var ok  = a.cumple_estado === 'Vigente';
      acredHtml += '<span class="acred-tag ' + (ok ? 'acred-ok' : 'acred-fail') + '">' +
                   (ok ? '✓' : '✗') + ' ' + a.tipo + '</span>';
    });
    acredHtml += '</div>';
  }

  var puedeBtn = s.puede_solicitar !== false;
  var sJson    = escapeAttr(JSON.stringify(s));
  var btnHtml  = puedeBtn
    ? '<button class="btn btn-primary btn-full btn-sm" onclick="abrirSolicitudModal(' + sJson + ')">Solicitar servicio</button>'
    : '<button class="btn btn-outline btn-full btn-sm" disabled title="Faltan acreditaciones requeridas">Acreditaciones pendientes</button>';

  var adminBtns = _adminMode
    ? '<div class="service-card-admin">' +
        '<button class="btn btn-secondary btn-sm" onclick="abrirAdminModal(' + sJson + ')">Editar</button>' +
        '<button class="btn btn-danger btn-sm" onclick="eliminarServicio(\'' + s.id_servicio + '\')">Eliminar</button>' +
      '</div>'
    : '';

  return '<div class="service-card">' +
    '<div class="service-card-img">' + icon + '</div>' +
    '<div class="service-card-body">' +
      '<div class="service-card-badges">' + tipoBadge + '<span class="badge ' + badgeCls + '">' + (s.nombre_categoria || s.categoria) + '</span></div>' +
      '<div class="service-card-name">' + _esc(s.descripcion) + '</div>' +
      '<div class="service-card-location">📍 ' + _esc(s.nombre_entidad).toUpperCase() + '</div>' +
      priceHtml +
      acredHtml +
    '</div>' +
    adminBtns +
    '<div class="service-card-footer">' + btnHtml + '</div>' +
  '</div>';
}

/* ── Solicitudes table ───────────────────────────────────────────────────── */
function cargarSolicitudes() {
  fetch('/api/servicios/solicitudes', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _solData = data.solicitudes || [];
      _renderSolicitudesTable();
    })
    .catch(function () { showToast('Error al cargar solicitudes', 'error'); });
}

function _renderSolicitudesTable() {
  var tbody = document.getElementById('solicitudes-body');
  if (!tbody) return;

  if (_solData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No tienes solicitudes registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = _solData.map(function (s) {
    var total       = parseInt(s.total_pasos)       || 0;
    var completados = parseInt(s.pasos_completados) || 0;
    var pct         = total > 0 ? Math.round((completados / total) * 100) : 0;
    var estado      = _SOL_ESTADO[s.estado] || _SOL_ESTADO['default'];
    var fecha       = s.fecha_apertura ? new Date(s.fecha_apertura).toLocaleDateString('es-VE') : '—';
    var catBadge    = _catBadge(s.categoria);

    var progressHtml =
      '<div class="sol-progress-wrap">' +
        '<div class="sol-progress-bar"><div class="sol-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="sol-progress-label">' + completados + '/' + total + '</span>' +
      '</div>';

    var cancelBtn = s.estado === 'Pendiente'
      ? '<button class="btn btn-danger btn-sm" onclick="cancelarSolicitud(\'' + s.id_solicitud + '\')">Cancelar</button>'
      : '';

    return '<tr>' +
      '<td><code style="font-size:.78rem;">' + s.id_solicitud + '</code></td>' +
      '<td>' + _esc(s.nombre_servicio) + '</td>' +
      '<td><span class="badge ' + catBadge + '">' + _esc(s.nombre_categoria || s.categoria) + '</span></td>' +
      '<td>' + fecha + '</td>' +
      '<td>' + progressHtml + '</td>' +
      '<td><span class="badge ' + estado.cls + '">' + estado.label + '</span></td>' +
      '<td><div style="display:flex;gap:var(--space-2);">' +
        '<button class="btn btn-secondary btn-sm" onclick="verDetalle(\'' + s.id_solicitud + '\')">Ver detalle</button>' +
        cancelBtn +
      '</div></td>' +
    '</tr>';
  }).join('');

  makePaginated('solicitudes-table', 5);
}

/* ── Request modal (3 steps) ─────────────────────────────────────────────── */
window.abrirSolicitudModal = function (servicio) {
  if (typeof servicio === 'string') {
    try { servicio = JSON.parse(servicio); } catch (e) { return; }
  }
  _solModal = { servicio: servicio, step: 1, acompanantes: [] };
  _renderSolModal();
  openModal('solicitud-modal');
};

function _renderSolModal() {
  _renderSolSteps();
  if (_solModal.step === 1) _renderSolStep1();
  if (_solModal.step === 2) _renderSolStep2();
  if (_solModal.step === 3) _renderSolStep3();
}

function _renderSolSteps() {
  var labels = ['Servicio', 'Acompañantes', 'Confirmar'];
  var html   = '';
  labels.forEach(function (label, i) {
    var n    = i + 1;
    var done = n < _solModal.step;
    var cur  = n === _solModal.step;
    html += '<div class="step-item">' +
      '<div class="step-dot' + (done ? ' completed' : cur ? ' active' : '') + '">' + (done ? '✓' : n) + '</div>' +
      '<div class="step-label' + (cur ? ' active' : '') + '">' + label + '</div>' +
      '</div>';
    if (i < labels.length - 1)
      html += '<div class="step-line' + (done ? ' completed' : '') + '"></div>';
  });
  document.getElementById('sol-steps').innerHTML = html;
}

function _renderSolStep1() {
  var s = _solModal.servicio;
  var priceBlock = '';
  if (s.costo_min !== null && s.costo_min !== undefined) {
    priceBlock = '<p style="margin:0;font-size:.875rem;"><strong>Rango de tarifa:</strong> ' +
      '$' + parseFloat(s.costo_min).toFixed(2) + ' – $' + parseFloat(s.costo_max).toFixed(2) + '</p>';
  }

  var acredBlock = '';
  if (s.acreditaciones && s.acreditaciones.length > 0) {
    acredBlock = '<div class="info-box" style="margin-top:var(--space-3);">' +
      '<div class="info-box-title">Acreditaciones requeridas</div>';
    s.acreditaciones.forEach(function (a) {
      var ok  = a.cumple_estado === 'Vigente';
      var cls = ok ? 'badge-success' : 'badge-danger';
      var lbl = ok ? 'Vigente ✓' : 'No cumple ✗';
      acredBlock +=
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--color-border);">' +
        '<span style="font-size:.875rem;">' + _esc(a.tipo) + '</span>' +
        '<span class="badge ' + cls + '">' + lbl + '</span></div>';
    });
    acredBlock += '</div>';
  }

  document.getElementById('sol-body').innerHTML =
    '<div class="info-box">' +
    '<div class="info-box-title">Información del Servicio</div>' +
    '<p style="margin:0 0 var(--space-2);font-weight:700;">' + _esc(s.descripcion) + '</p>' +
    '<p style="margin:0 0 var(--space-2);color:var(--color-text-muted);font-size:.875rem;">Prestado por: ' + _esc(s.nombre_entidad) + '</p>' +
    priceBlock +
    '</div>' +
    acredBlock +
    '<div class="modal-footer">' +
    '<button class="btn btn-secondary" onclick="closeModal(\'solicitud-modal\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="solNext1()">Continuar →</button>' +
    '</div>';
}

window.solNext1 = function () { _solModal.step = 2; _renderSolModal(); };

function _renderSolStep2() {
  var rows = _solModal.acompanantes.map(function (c, i) {
    return _compRow(i, c.nombre, c.documento);
  }).join('');

  document.getElementById('sol-body').innerHTML =
    '<div class="form-group">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<label class="form-label" style="margin:0;">Acompañantes <small style="color:var(--color-text-muted);">(máx. 5)</small></label>' +
        '<button class="btn btn-secondary btn-sm" id="btn-add-comp" onclick="solAddComp()"' +
          (_solModal.acompanantes.length >= 5 ? ' disabled' : '') + '>+ Agregar</button>' +
      '</div>' +
    '</div>' +
    '<div id="comp-list">' + rows + '</div>' +
    '<p style="margin-top:.75rem;font-size:.85rem;color:var(--color-text-muted);">¿Sin acompañantes? <a href="#" onclick="solSkipComps();return false;" style="color:var(--color-primary);">Saltar este paso →</a></p>' +
    '<div class="modal-footer">' +
      '<button class="btn btn-secondary" onclick="solBack()">← Atrás</button>' +
      '<button class="btn btn-primary" onclick="solNext2()">Continuar →</button>' +
    '</div>';
}

function _compRow(idx, nombre, documento) {
  return '<div class="companion-row" id="comp-row-' + idx + '" style="display:flex;gap:.5rem;margin-bottom:.5rem;">' +
    '<input class="form-input" placeholder="Nombre completo" id="comp-nombre-' + idx + '" value="' + _esc(nombre || '') + '" style="flex:1;">' +
    '<input class="form-input" placeholder="Cédula / Pasaporte" id="comp-doc-' + idx + '" value="' + _esc(documento || '') + '" style="width:160px;">' +
    '<button class="btn-icon" style="color:var(--color-danger);font-size:1.2rem;line-height:1;flex-shrink:0;" onclick="solRemoveComp(' + idx + ')">×</button>' +
    '</div>';
}

window.solAddComp = function () {
  if (_solModal.acompanantes.length >= 5) { showToast('Máximo 5 acompañantes', 'warning'); return; }
  _solModal.acompanantes.push({ nombre: '', documento: '' });
  var list = document.getElementById('comp-list');
  if (list) {
    var div = document.createElement('div');
    div.innerHTML = _compRow(_solModal.acompanantes.length - 1, '', '');
    list.appendChild(div.firstElementChild);
  }
  if (_solModal.acompanantes.length >= 5) {
    var btn = document.getElementById('btn-add-comp');
    if (btn) btn.disabled = true;
  }
};

window.solRemoveComp = function (idx) {
  _collectComps();
  _solModal.acompanantes.splice(idx, 1);
  _renderSolModal();
};

window.solSkipComps = function () {
  _solModal.acompanantes = [];
  _solModal.step = 3;
  _renderSolModal();
};

window.solBack = function () {
  _solModal.step = Math.max(1, _solModal.step - 1);
  _renderSolModal();
};

function _collectComps() {
  _solModal.acompanantes.forEach(function (c, i) {
    var n = document.getElementById('comp-nombre-' + i);
    var d = document.getElementById('comp-doc-' + i);
    if (n) c.nombre    = n.value.trim();
    if (d) c.documento = d.value.trim();
  });
}

window.solNext2 = function () {
  _collectComps();
  _solModal.acompanantes = _solModal.acompanantes.filter(function (c) { return c.nombre && c.documento; });
  _solModal.step = 3;
  _renderSolModal();
};

function _renderSolStep3() {
  var s     = _solModal.servicio;
  var comps = _solModal.acompanantes.length
    ? _solModal.acompanantes.map(function (c) { return _esc(c.nombre) + ' (' + _esc(c.documento) + ')'; }).join(', ')
    : 'Ninguno';

  document.getElementById('sol-body').innerHTML =
    '<div class="info-box">' +
    '<div class="info-box-title">📋 Resumen de Solicitud</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td class="sum-label">Servicio</td><td><strong>' + _esc(s.descripcion) + '</strong></td></tr>' +
      '<tr><td class="sum-label">Entidad</td><td>' + _esc(s.nombre_entidad) + '</td></tr>' +
      '<tr><td class="sum-label">Categoría</td><td>' + _esc(s.nombre_categoria || s.categoria) + '</td></tr>' +
      '<tr><td class="sum-label">Acompañantes</td><td>' + comps + '</td></tr>' +
    '</table>' +
    '</div>' +
    '<style>.sum-label{color:var(--color-text-muted);padding:.3rem .5rem;white-space:nowrap;width:130px;}' +
    'td{padding:.3rem .5rem;}</style>' +
    '<div class="modal-footer">' +
      '<button class="btn btn-secondary" onclick="solBack()">← Atrás</button>' +
      '<button class="btn btn-primary" id="btn-confirmar-sol" onclick="confirmarSolicitud()">Confirmar Solicitud</button>' +
    '</div>';
}

window.confirmarSolicitud = function () {
  var btn = document.getElementById('btn-confirmar-sol');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  fetch('/api/servicios/solicitudes', {
    method:  'POST',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({
      id_servicio:  _solModal.servicio.id_servicio,
      acompanantes: _solModal.acompanantes
    })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) {
        var msg = data.error + (data.faltantes ? ': ' + data.faltantes.join(', ') : '');
        showToast(msg, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar Solicitud'; }
        return;
      }
      closeModal('solicitud-modal');
      showToast('Solicitud creada. ID: ' + data.id_solicitud, 'success');
      cargarSolicitudes();
    })
    .catch(function () {
      showToast('Error al crear la solicitud', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Confirmar Solicitud'; }
    });
};

/* ── Solicitud detail modal ──────────────────────────────────────────────── */
window.verDetalle = function (idSolicitud) {
  document.getElementById('detalle-body').innerHTML =
    '<p style="padding:var(--space-5);color:var(--color-text-muted);text-align:center;">Cargando...</p>';
  openModal('detalle-modal');

  fetch('/api/servicios/solicitudes/' + idSolicitud, { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) { _renderDetalle(data); })
    .catch(function () {
      document.getElementById('detalle-body').innerHTML =
        '<p style="padding:var(--space-4);color:var(--color-danger);text-align:center;">Error al cargar el detalle.</p>';
    });
};

function _renderDetalle(data) {
  var sol   = data.solicitud    || {};
  var pasos = data.pasos        || [];
  var comps = data.acompanantes || [];

  var estadoInfo = _SOL_ESTADO[sol.estado] || _SOL_ESTADO['default'];
  var fecha = sol.fecha_apertura ? new Date(sol.fecha_apertura).toLocaleDateString('es-VE') : '—';

  var pasosHtml = pasos.length === 0
    ? '<p style="color:var(--color-text-muted);font-size:.875rem;">Sin pasos de actividad registrados.</p>'
    : pasos.map(function (p, i) {
        var done      = p.estado_paso === 'Completado';
        var fechaComp = p.fecha_completada
          ? new Date(p.fecha_completada).toLocaleString('es-VE')
          : null;
        var adminBtn  = _adminMode && !done
          ? '<button class="btn btn-primary btn-sm" onclick="completarPaso(\'' + sol.id_solicitud + '\',\'' + p.id_paso + '\')">Completar paso</button>'
          : '';
        return '<div class="paso-item ' + (done ? 'paso-done' : 'paso-pending') + '">' +
          '<div class="paso-num">' + (done ? '✓' : (i + 1)) + '</div>' +
          '<div class="paso-info">' +
            '<div class="paso-responsable">' + _esc(p.responsable) + '</div>' +
            '<div class="paso-estado">' +
              '<span class="badge ' + (done ? 'badge-success' : 'badge-warning') + '">' + p.estado_paso + '</span>' +
              (fechaComp ? ' <small style="color:var(--color-text-muted);">' + fechaComp + '</small>' : '') +
            '</div>' +
          '</div>' +
          (adminBtn ? '<div>' + adminBtn + '</div>' : '') +
        '</div>';
      }).join('');

  var compsHtml = comps.length
    ? comps.map(function (c) {
        return '<span class="badge badge-gray" style="margin:2px;">' + _esc(c.nombre) + ' (' + _esc(c.documento) + ')</span>';
      }).join('')
    : '<span style="color:var(--color-text-muted);font-size:.875rem;">Ninguno</span>';

  document.getElementById('detalle-body').innerHTML =
    '<div style="padding:var(--space-4);">' +
    '<div class="info-box" style="margin-bottom:var(--space-4);">' +
    '<div class="info-box-title">Información General</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td class="sum-label">ID</td><td><code style="font-size:.8rem;">' + sol.id_solicitud + '</code></td></tr>' +
      '<tr><td class="sum-label">Servicio</td><td>' + _esc(sol.nombre_servicio) + '</td></tr>' +
      '<tr><td class="sum-label">Entidad</td><td>' + _esc(sol.nombre_entidad) + '</td></tr>' +
      '<tr><td class="sum-label">Fecha apertura</td><td>' + fecha + '</td></tr>' +
      '<tr><td class="sum-label">Estado</td><td><span class="badge ' + estadoInfo.cls + '">' + estadoInfo.label + '</span></td></tr>' +
      (sol.resolucion ? '<tr><td class="sum-label">Resolución</td><td>' + _esc(sol.resolucion) + '</td></tr>' : '') +
    '</table></div>' +
    '<style>.sum-label{color:var(--color-text-muted);padding:.3rem .5rem;white-space:nowrap;width:140px;vertical-align:top;}td{padding:.3rem .5rem;}</style>' +
    '<div style="margin-bottom:var(--space-4);">' +
      '<div style="font-weight:600;margin-bottom:var(--space-3);">Flujo de actividad</div>' +
      '<div class="pasos-container">' + pasosHtml + '</div>' +
    '</div>' +
    '<div>' +
      '<div style="font-weight:600;margin-bottom:var(--space-2);">Acompañantes</div>' +
      compsHtml +
    '</div>' +
    '</div>';
}

window.completarPaso = function (idSolicitud, idPaso) {
  fetch('/api/servicios/solicitudes/' + idSolicitud + '/paso/' + idPaso, {
    method:  'PATCH',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({})
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Paso completado exitosamente', 'success');
      cargarSolicitudes();
      verDetalle(idSolicitud);
    })
    .catch(function () { showToast('Error al completar el paso', 'error'); });
};

/* ── Cancel solicitud ────────────────────────────────────────────────────── */
window.cancelarSolicitud = function (id) {
  if (!confirm('¿Cancelar la solicitud ' + id + '? Esta acción no se puede deshacer.')) return;
  fetch('/api/servicios/solicitudes/' + id, {
    method:  'DELETE',
    headers: _authHeaders()
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Solicitud cancelada', 'success');
      cargarSolicitudes();
    })
    .catch(function () { showToast('Error al cancelar la solicitud', 'error'); });
};

/* ── Admin: Create/Edit service modal ────────────────────────────────────── */
window.abrirAdminModal = function (servicio) {
  if (typeof servicio === 'string') {
    try { servicio = JSON.parse(servicio); } catch (e) { servicio = null; }
  }
  _adminSvcData = servicio || null;
  document.getElementById('admin-modal-title').textContent = servicio ? 'Editar Servicio' : 'Nuevo Servicio';

  Promise.all([
    fetch('/api/servicios/categorias', { headers: _authHeaders() }).then(function (r) { return r.json(); }),
    fetch('/api/servicios/entidades',  { headers: _authHeaders() }).then(function (r) { return r.json(); })
  ])
    .then(function (results) {
      _renderAdminForm(servicio, results[0].categorias || [], results[1].entidades || []);
      openModal('admin-servicio-modal');
    })
    .catch(function () { showToast('Error al cargar datos del formulario', 'error'); });
};

function _renderAdminForm(s, categorias, entidades) {
  var catOpts = categorias.map(function (c) {
    return '<option value="' + c.id_categoria + '"' + (s && s.id_categoria === c.id_categoria ? ' selected' : '') + '>' + _esc(c.nombre) + '</option>';
  }).join('');

  var entOpts = entidades.map(function (e) {
    var lbl = e.tipo === 'interna'
      ? _esc(e.nombre_entidad) + ' (UCAB)'
      : _esc(e.razon_social || e.nombre_entidad) + ' (Aliado)';
    return '<option value="' + e.nombre_entidad + '"' + (s && s.nombre_entidad === e.nombre_entidad ? ' selected' : '') + '>' + lbl + '</option>';
  }).join('');

  var idField = s
    ? '<div class="form-group"><label class="form-label">ID Servicio</label><input class="form-input" value="' + _esc(s.id_servicio) + '" disabled></div>'
    : '<div class="form-group"><label class="form-label">ID Servicio <small style="color:var(--color-text-muted);">(único, ej: SVC-LAB-001)</small></label>' +
      '<input class="form-input" id="admin-id" placeholder="SVC-XXX-000" value=""></div>';

  document.getElementById('admin-modal-body').innerHTML =
    '<div style="padding:var(--space-4);">' +
    idField +
    '<div class="form-group"><label class="form-label">Descripción / Nombre</label>' +
    '<input class="form-input" id="admin-desc" placeholder="Nombre del servicio" value="' + (s ? _esc(s.descripcion) : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Categoría</label>' +
    '<select class="form-select" id="admin-cat"><option value="">Seleccionar...</option>' + catOpts + '</select></div>' +
    '<div class="form-group"><label class="form-label">Entidad Prestadora</label>' +
    '<select class="form-select" id="admin-ent"><option value="">Seleccionar...</option>' + entOpts + '</select></div>' +
    '<div class="modal-footer">' +
      '<button class="btn btn-secondary" onclick="closeModal(\'admin-servicio-modal\')">Cancelar</button>' +
      '<button class="btn btn-primary" id="btn-guardar-svc" onclick="guardarServicio()">Guardar</button>' +
    '</div></div>';
}

window.guardarServicio = function () {
  var desc = (document.getElementById('admin-desc') || {}).value || '';
  var cat  = (document.getElementById('admin-cat')  || {}).value || '';
  var ent  = (document.getElementById('admin-ent')  || {}).value || '';
  var id   = _adminSvcData
    ? _adminSvcData.id_servicio
    : ((document.getElementById('admin-id') || {}).value || '').trim();

  if (!desc || !cat || !ent || !id) {
    showToast('Por favor complete todos los campos', 'warning'); return;
  }

  var btn = document.getElementById('btn-guardar-svc');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  var url    = _adminSvcData ? '/api/servicios/' + _adminSvcData.id_servicio : '/api/servicios';
  var method = _adminSvcData ? 'PUT' : 'POST';
  var body   = { descripcion: desc, nombre_entidad: ent, id_categoria: cat };
  if (!_adminSvcData) body.id_servicio = id;

  fetch(url, {
    method:  method,
    headers: _authJsonHeaders(),
    body:    JSON.stringify(body)
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) {
        showToast(data.error, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
        return;
      }
      closeModal('admin-servicio-modal');
      showToast(_adminSvcData ? 'Servicio actualizado' : 'Servicio creado exitosamente', 'success');
      cargarCatalogo();
    })
    .catch(function () {
      showToast('Error al guardar el servicio', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    });
};

window.eliminarServicio = function (id) {
  if (!confirm('¿Eliminar el servicio "' + id + '"? Esta acción no se puede deshacer.')) return;
  fetch('/api/servicios/' + id, {
    method:  'DELETE',
    headers: _authHeaders()
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Servicio eliminado', 'success');
      cargarCatalogo();
    })
    .catch(function () { showToast('Error al eliminar el servicio', 'error'); });
};

/* ── String helpers ──────────────────────────────────────────────────────── */
function _esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeAttr(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
