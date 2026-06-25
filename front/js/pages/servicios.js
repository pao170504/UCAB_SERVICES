/* servicios.js */
var _catalog    = [];
var _categorias = [];
var _solData    = [];
var _adminMode  = false;

var _EXCLUDED_IDS  = ['SERV-AUDIT','SERV-SALON','SERV-LAB','SERV-CANCHA','SERV-ESTAC'];
var _EXCLUDED_ENTS = ['UCAB - Infraestructura','UCAB - Estacionamiento'];

var _SERVICIOS_CON_ACOMPANANTES = ['SVC-CUL-001', 'SVC-CUL-002', 'SVC-DEP-001', 'SVC-DEP-002'];

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
    _adminMode = esAdminSistema();
    var btn = document.getElementById('btn-nuevo-servicio');
    if (btn) btn.style.display = _adminMode ? '' : 'none';
    _renderCards();
  });

  cargarCatalogo();
  cargarSolicitudes();

  // Eager role check — don't wait for auth-guard to fire renderForRole
  var _u = typeof getUsuario === 'function' ? getUsuario() : null;
  if (_u) {
    var _esAdmin = esAdminSistema();
    var _tabAdmin = document.getElementById('tab-gestion-tramites');
    if (_tabAdmin) _tabAdmin.style.display = _esAdmin ? '' : 'none';
    if (_esAdmin) cargarSolicitudesAdmin();
  }
});

window.renderForRole = function (rol) {
  _adminMode = esAdminSistema();
  var btn = document.getElementById('btn-nuevo-servicio');
  if (btn) btn.style.display = _adminMode ? '' : 'none';

  var tabGestion = document.getElementById('tab-gestion-tramites');
  if (tabGestion) tabGestion.style.display = _adminMode ? '' : 'none';

  if (_adminMode) cargarSolicitudesAdmin();

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
    // Client-side safety filter — never show infra/estacionamiento
    if (_EXCLUDED_IDS.indexOf(s.id_servicio) !== -1 ||
        _EXCLUDED_ENTS.indexOf(s.nombre_entidad) !== -1) return false;
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
    : '<button class="btn btn-outline btn-full btn-sm" onclick="abrirSolicitudModal(' + sJson + ')" title="Te faltan acreditaciones — toca para ver cuáles">Ver acreditaciones pendientes</button>';

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
  configurarPasosSolicitud(servicio.id_servicio);
  openModal('solicitud-modal');
  /* Cargar requisitos del servicio (acreditaciones + cumplimiento del usuario) y refrescar el paso 1 */
  fetch('/api/servicios/requisitos/' + encodeURIComponent(servicio.id_servicio), { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _solModal.servicio.acreditaciones    = data.acreditaciones || [];
      _solModal.servicio.requisitos_acceso = data.requisitos_acceso || [];
      if (_solModal.step === 1) _renderSolStep1();
    })
    .catch(function () {});
};

function _renderSolModal() {
  _renderSolSteps();
  if (_solModal.step === 1) _renderSolStep1();
  if (_solModal.step === 2) _renderSolStep2();
  if (_solModal.step === 3) _renderSolStep3();
}

function _renderSolSteps() {
  var s        = _solModal.servicio;
  var conAcomp = s && _SERVICIOS_CON_ACOMPANANTES.indexOf(s.id_servicio) !== -1;
  var labels   = conAcomp
    ? ['Servicio', 'Acompañantes', 'Confirmar']
    : ['Servicio', 'Confirmar'];
  // Map internal step (1/2/3) to display step for 2-step flow
  var displayStep = _solModal.step;
  if (!conAcomp && _solModal.step === 3) displayStep = 2;

  var html = '';
  labels.forEach(function (label, i) {
    var n    = i + 1;
    var done = n < displayStep;
    var cur  = n === displayStep;
    html += '<div class="step-item">' +
      '<div class="step-dot' + (done ? ' completed' : cur ? ' active' : '') + '">' + (done ? '✓' : n) + '</div>' +
      '<div class="step-label' + (cur ? ' active' : '') + '">' + label + '</div>' +
      '</div>';
    if (i < labels.length - 1)
      html += '<div class="step-line' + (done ? ' completed' : '') + '"></div>';
  });
  document.getElementById('sol-steps').innerHTML = html;
}

function configurarPasosSolicitud(idServicio) {
  var conAcomp = _SERVICIOS_CON_ACOMPANANTES.indexOf(idServicio) !== -1;
  var dot2   = document.getElementById('solicitud-dot-2');
  var linea2 = document.getElementById('solicitud-linea-2');
  if (dot2)   dot2.style.display   = conAcomp ? '' : 'none';
  if (linea2) linea2.style.display = conAcomp ? '' : 'none';
}

function _renderSolStep1() {
  var s = _solModal.servicio;
  var priceBlock = '';
  if (s.costo_min !== null && s.costo_min !== undefined) {
    priceBlock = '<p style="margin:0;font-size:.875rem;"><strong>Rango de tarifa:</strong> ' +
      '$' + parseFloat(s.costo_min).toFixed(2) + ' – $' + parseFloat(s.costo_max).toFixed(2) + '</p>';
  }

  var acreds = s.acreditaciones || [];
  var reqAcc = s.requisitos_acceso || [];
  var faltan = acreds.filter(function (a) { return a.cumple_estado !== 'Vigente'; });
  var acredBlock = '<div class="info-box" style="margin-top:var(--space-3);">' +
    '<div class="info-box-title">Requisitos para reservar</div>';
  if (acreds.length === 0 && reqAcc.length === 0) {
    acredBlock += '<p style="margin:0;font-size:.85rem;color:var(--color-text-muted);">Este servicio no exige acreditaciones ni requisitos especiales.</p>';
  } else {
    if (acreds.length > 0) {
      acredBlock += '<p style="margin:0 0 6px;font-size:.8rem;font-weight:600;">Acreditaciones</p>';
      acreds.forEach(function (a) {
        var ok   = a.cumple_estado === 'Vigente';
        var ven  = a.cumple_estado && a.cumple_estado !== 'Vigente';
        var icon = ok ? '✅' : (ven ? '⚠️' : '❌');
        var nota = ok ? 'Ya la tienes (vigente)' : (ven ? ('La tienes pero ' + String(a.cumple_estado).toLowerCase()) : 'Te falta');
        acredBlock += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--color-border);">' +
          '<span style="font-size:.85rem;">' + icon + ' ' + _esc(a.tipo) + '</span>' +
          '<span style="font-size:.78rem;color:var(--color-text-muted);">' + nota + '</span></div>';
      });
    }
    if (reqAcc.length > 0) {
      acredBlock += '<p style="margin:10px 0 6px;font-size:.8rem;font-weight:600;">Documentos / condiciones</p>' +
        '<ul style="margin:0;padding-left:18px;font-size:.83rem;">' +
        reqAcc.map(function (t) { return '<li style="margin:2px 0;">' + _esc(t) + '</li>'; }).join('') + '</ul>';
    }
    if (faltan.length > 0) {
      acredBlock += '<div style="margin-top:10px;padding:8px 10px;background:rgba(220,38,38,.08);border-radius:8px;font-size:.8rem;">' +
        '⚠️ Te falta registrar ' + faltan.length + ' acreditación(es). Hazlo en ' +
        '<a href="acreditaciones.html" style="font-weight:600;text-decoration:underline;">Acreditaciones</a> antes de reservar, o la solicitud será rechazada.' +
        '</div>';
    }
  }
  acredBlock += '</div>';

  var footerBtn = faltan.length > 0
    ? '<a class="btn btn-primary" href="acreditaciones.html">Registrar acreditaciones →</a>'
    : '<button class="btn btn-primary" onclick="solNext1()">Continuar →</button>';

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
    footerBtn +
    '</div>';
}

window.solNext1 = function () {
  var s        = _solModal.servicio;
  var conAcomp = s && _SERVICIOS_CON_ACOMPANANTES.indexOf(s.id_servicio) !== -1;
  if (!conAcomp) {
    _solModal.acompanantes = [];
    _solModal.step = 3;
  } else {
    _solModal.step = 2;
  }
  _renderSolModal();
};

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
  var s        = _solModal.servicio;
  var conAcomp = s && _SERVICIOS_CON_ACOMPANANTES.indexOf(s.id_servicio) !== -1;
  if (_solModal.step === 3 && !conAcomp) {
    _solModal.step = 1;
  } else {
    _solModal.step = Math.max(1, _solModal.step - 1);
  }
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
  fetch('/api/admin/solicitudes/' + idSolicitud + '/paso/' + idPaso, {
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

/* ── Tab switcher (Mis Solicitudes / Gestión de Trámites) ───────────────── */
window.mostrarTabSolicitudes = function (tab) {
  var panelMis   = document.getElementById('mis-solicitudes-panel');
  var panelAdmin = document.getElementById('admin-tramites-container');
  var btnMis     = document.getElementById('tab-mis-solicitudes');
  var btnAdmin   = document.getElementById('tab-gestion-tramites');

  if (panelMis)   panelMis.style.display   = tab === 'mis'   ? '' : 'none';
  if (panelAdmin) panelAdmin.style.display = tab === 'admin' ? '' : 'none';
  if (btnMis)   btnMis.className   = tab === 'mis'   ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  if (btnAdmin) btnAdmin.className = tab === 'admin' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
};

/* ── Admin: Gestión de Trámites ──────────────────────────────────────────── */
async function cargarSolicitudesAdmin() {
  try {
    var res  = await fetch('/api/admin/solicitudes/pendientes', { headers: _authHeaders() });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    renderSolicitudesAdmin(data.solicitudes || []);
  } catch (err) {
    console.warn('No se pudieron cargar los trámites:', err.message);
  }
}

function renderSolicitudesAdmin(solicitudes) {
  var container = document.getElementById('admin-tramites-container');
  if (!container) return;

  if (!solicitudes.length) {
    container.innerHTML =
      '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-muted)">' +
      '<span style="font-size:2rem;display:block;margin-bottom:var(--space-2)">✅</span>' +
      '<p>No hay trámites pendientes de gestión.</p>' +
      '</div>';
    return;
  }

  container.innerHTML =
    '<div class="table-wrap" style="border:none;border-radius:0;">' +
    '<table class="table table-hover" id="tabla-admin-tramites">' +
    '<thead><tr>' +
      '<th>ID Solicitud</th><th>Servicio</th><th>Categoría</th><th>Solicitante</th>' +
      '<th>Fecha</th><th>Progreso</th><th>Paso Actual</th><th>Acciones</th>' +
    '</tr></thead>' +
    '<tbody>' +
    solicitudes.map(function (s) {
      var total     = parseInt(s.total_pasos)       || 0;
      var completados = parseInt(s.pasos_completados) || 0;
      var progreso  = total > 0 ? Math.round((completados / total) * 100) : 0;
      var fecha     = s.fecha_apertura ? new Date(s.fecha_apertura).toLocaleDateString('es-VE') : '—';
      return '<tr>' +
        '<td style="font-family:monospace;font-size:.75rem">' + _esc(s.id_solicitud) + '</td>' +
        '<td>' + _esc(s.servicio) + '</td>' +
        '<td><span class="badge badge-info" style="font-size:.72rem">' + _esc(s.categoria || '—') + '</span></td>' +
        '<td>' +
          '<div style="font-weight:500">' + _esc(s.solicitante) + '</div>' +
          '<div style="font-size:.73rem;color:var(--color-text-muted)">' + _esc(s.correo_institucional) + '</div>' +
        '</td>' +
        '<td>' + fecha + '</td>' +
        '<td>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="flex:1;min-width:80px;background:var(--color-border);border-radius:999px;height:6px">' +
              '<div style="background:var(--color-blue);width:' + progreso + '%;height:6px;border-radius:999px"></div>' +
            '</div>' +
            '<span style="font-size:.73rem;white-space:nowrap">' + completados + '/' + total + '</span>' +
          '</div>' +
        '</td>' +
        '<td style="font-size:.82rem;color:var(--color-text-secondary)">' +
          _esc(s.paso_pendiente_responsable || '—') +
        '</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
            '<button class="btn btn-outline btn-sm" onclick="verRequisitosAdminTramite(\'' + s.id_solicitud + '\')">📋 Requisitos</button>' +
            '<button class="btn btn-outline btn-sm" onclick="verDetalleAdminTramite(\'' + s.id_solicitud + '\')">Ver pasos</button>' +
            (s.paso_pendiente_id
              ? '<button class="btn btn-primary btn-sm" onclick="aprobarPaso(\'' + s.id_solicitud + '\',\'' + s.paso_pendiente_id + '\')">✓ Aprobar</button>'
              : '<span style="font-size:.75rem;color:var(--color-text-muted)">Sin pasos pendientes</span>') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table></div>';

  if (typeof makeTableSortable   === 'function') makeTableSortable('tabla-admin-tramites');
  if (typeof makeTableSearchable === 'function') makeTableSearchable('tabla-admin-tramites');
}

window.aprobarPaso = async function (idSolicitud, idPaso) {
  if (!confirm('¿Confirmas la aprobación de este paso?')) return;
  try {
    var res  = await fetch(
      '/api/admin/solicitudes/' + idSolicitud + '/paso/' + idPaso,
      { method: 'PATCH', headers: _authJsonHeaders(), body: JSON.stringify({}) }
    );
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');

    if (data.completada) {
      showToast('✓ Trámite completado. Todos los pasos fueron aprobados.', 'success');
    } else {
      showToast('Paso aprobado. El trámite avanzó al siguiente paso.', 'success');
    }
    await cargarSolicitudesAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.verDetalleAdminTramite = async function (idSolicitud) {
  try {
    var res  = await fetch(
      '/api/servicios/solicitudes/' + idSolicitud + '/pasos',
      { headers: _authHeaders() }
    );
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    var pasos = data.pasos || [];

    var PASO_COLOR = {
      'Completado': 'var(--color-success)',
      'En proceso': 'var(--color-blue)',
      'Pendiente':  'var(--color-warning)'
    };

    document.getElementById('modal-admin-pasos-lista').innerHTML =
      pasos.map(function (p, i) {
        var col     = PASO_COLOR[p.estado_paso] || '#E5E7EB';
        var fechaC  = p.fecha_completada
          ? ' · ' + new Date(p.fecha_completada).toLocaleString('es-VE')
          : '';
        var dotContent = p.estado_paso === 'Completado' ? '✓' : (i + 1);
        return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-border)">' +
          '<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;' +
                'background:' + col + '22;border:2px solid ' + col + ';' +
                'display:flex;align-items:center;justify-content:center;' +
                'font-size:.75rem;font-weight:700;color:' + col + '">' + dotContent + '</div>' +
          '<div>' +
            '<p style="margin:0;font-weight:600">' + _esc(p.responsable) + '</p>' +
            '<p style="margin:2px 0 0;font-size:.78rem;color:var(--color-text-secondary)">' +
              _esc(p.estado_paso) + _esc(fechaC) +
            '</p>' +
          '</div>' +
        '</div>';
      }).join('');

    openModal('modal-admin-pasos');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.verRequisitosAdminTramite = async function (idSolicitud) {
  try {
    var res  = await fetch('/api/admin/solicitudes/' + idSolicitud + '/requisitos', { headers: _authHeaders() });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');

    var H = '<div style="margin-bottom:var(--space-4)">' +
              '<div style="font-weight:600;font-size:1rem">' + _esc(data.solicitud.servicio) + '</div>' +
              '<div style="font-size:.8rem;color:var(--color-text-muted)">Solicitud ' + _esc(data.solicitud.id) + '</div>' +
            '</div>';

    var perfil;
    if (data.academico) {
      var a = data.academico;
      perfil = '<span class="badge badge-info">Estudiante</span>' +
        '<div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.85rem">' +
          '<div>UC aprobadas: <strong>' + _esc(a.uc_aprobadas) + '</strong></div>' +
          '<div>Promedio: <strong>' + _esc(a.promedio) + '</strong></div>' +
          '<div>Semestre: <strong>' + _esc(a.semestre) + '</strong></div>' +
          '<div>Escuela: <strong>' + _esc(a.escuela) + '</strong></div>' +
        '</div>';
    } else if (data.egresado) {
      var g = data.egresado;
      perfil = '<span class="badge badge-info">Egresado</span>' +
        '<div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.85rem">' +
          '<div>Título: <strong>' + _esc(g.titulo) + '</strong></div>' +
          '<div>Índice académico: <strong>' + _esc(g.indice_academico) + '</strong></div>' +
          '<div>Año graduación: <strong>' + _esc(g.ano_graduacion) + '</strong></div>' +
        '</div>';
    } else {
      perfil = '<span class="badge" style="background:var(--color-border);color:var(--color-text-secondary)">Personal / sin datos académicos</span>';
    }
    H += _seccionReq('Solicitante',
           '<div style="font-weight:500">' + _esc(data.solicitud.solicitante) + ' · ' + _esc(data.solicitud.cedula) + '</div>' +
           '<div style="margin-top:6px">' + perfil + '</div>');

    var ra = data.requisitos_acceso || [];
    H += _seccionReq('Requisitos de acceso',
           ra.length
             ? '<ul style="margin:0;padding-left:18px;font-size:.85rem">' + ra.map(function (t) { return '<li style="margin:3px 0">' + _esc(t) + '</li>'; }).join('') + '</ul>'
             : '<span style="color:var(--color-text-muted);font-size:.85rem">Sin requisitos de acceso registrados.</span>');

    var ac = data.acreditaciones || [];
    H += _seccionReq('Acreditaciones exigidas',
           ac.length
             ? ac.map(function (x) {
                 var ok  = x.cumple && x.estado === 'Vigente';
                 var ven = x.cumple && x.estado && x.estado !== 'Vigente';
                 var icon = ok ? '✅' : (ven ? '⚠️' : '❌');
                 var nota = !x.cumple ? 'No registrada por el solicitante'
                          : (ven ? ('Estado: ' + x.estado)
                                 : ('Vigente' + (x.fecha_vencimiento ? ' · vence ' + new Date(x.fecha_vencimiento).toLocaleDateString('es-VE') : '')));
                 return '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--color-border)">' +
                          '<span>' + icon + '</span>' +
                          '<div style="font-size:.85rem">' +
                            '<div>' + _esc(x.descripcion) + '</div>' +
                            '<div style="color:var(--color-text-muted);font-size:.78rem">' + _esc(nota) + '</div>' +
                          '</div>' +
                        '</div>';
               }).join('')
             : '<span style="color:var(--color-text-muted);font-size:.85rem">Este servicio no exige acreditaciones.</span>');

    var sv = data.solvencia || {};
    var solvHtml;
    if (!sv.facturas_total) {
      solvHtml = '<span style="color:var(--color-text-muted);font-size:.85rem">Sin facturas asociadas al trámite.</span>';
    } else if (Number(sv.saldo_total) <= 0) {
      solvHtml = '<span style="font-size:.85rem">✅ Al día — sin saldo pendiente (' + sv.facturas_total + ' factura(s)).</span>';
    } else {
      solvHtml = '<span style="font-size:.85rem">⚠️ Saldo pendiente: <strong>Bs ' + Number(sv.saldo_total).toLocaleString('es-VE') + '</strong> en ' + sv.facturas_pendientes + ' de ' + sv.facturas_total + ' factura(s).</span>';
    }
    H += _seccionReq('Solvencia (caja)', solvHtml);

    H += '<div style="margin-top:var(--space-3);padding:10px;background:var(--color-bg-subtle,#F9FAFB);border-radius:8px;font-size:.78rem;color:var(--color-text-muted)">' +
           'Verificación manual: confirma estos requisitos antes de aprobar el paso correspondiente.' +
         '</div>';

    document.getElementById('modal-admin-requisitos-body').innerHTML = H;
    openModal('modal-admin-requisitos');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

function _seccionReq(titulo, contenido) {
  return '<div style="margin-bottom:var(--space-4)">' +
           '<div style="font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:6px">' + titulo + '</div>' +
           contenido +
         '</div>';
}

/* ── String helpers ──────────────────────────────────────────────────────── */
function _esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeAttr(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
