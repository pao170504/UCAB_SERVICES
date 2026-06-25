/* pagos.js — Payments module */

var _facturas   = [];
var facturasCache = [];
var _folios     = [];
var _tasas      = [];
var _terceros   = [];
var _adminMode  = false;
var _bcvRate    = 0;
var _currentFolioId = null;

/* ── Auth helpers ─────────────────────────────────────────────────────────── */
function _authHeaders() {
  var sid = sessionStorage.getItem('sessionID') || '';
  return { 'Authorization': 'Bearer ' + sid };
}
function _authJsonHeaders() {
  var sid = sessionStorage.getItem('sessionID') || '';
  return { 'Authorization': 'Bearer ' + sid, 'Content-Type': 'application/json' };
}

/* ── Status maps ──────────────────────────────────────────────────────────── */
var _ESTADO_PAGO = {
  'Pendiente': { cls: 'badge-warning', label: 'Pendiente' },
  'Parcial':   { cls: 'badge-info',    label: 'Parcial'   },
  'Pagada':    { cls: 'badge-success', label: 'Pagada'    },
  'default':   { cls: 'badge-gray',    label: '—'         }
};
var _FOLIO_ESTADO = {
  'Abierto': { cls: 'badge-warning', label: 'Abierto' },
  'Cerrado': { cls: 'badge-success', label: 'Cerrado' },
  'default': { cls: 'badge-gray',    label: '—'       }
};
var _METODO_LABEL = {
  tai:        'TAI — Carnet NFC',
  efectivo:   'Efectivo',
  movil:      'Pago Móvil',
  tarjeta:    'Tarjeta Crédito/Débito',
  cripto:     'Criptomoneda',
  zelle:      'Zelle',
  desconocido:'Desconocido'
};

/* ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  /* Tab switching */
  document.querySelectorAll('.pagos-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.dataset.tab);
    });
  });

  /* Table search & filter */
  document.getElementById('facturas-search')
    ?.addEventListener('input', function () {
      var q = this.value.toLowerCase().trim();
      var filtradas = facturasCache.filter(function (f) {
        return f.id_factura.toLowerCase().includes(q) ||
               (f.servicio || '').toLowerCase().includes(q);
      });
      renderTablaFacturas(filtradas);
    });

  document.getElementById('facturas-filter')
    ?.addEventListener('change', function () {
      var estado = this.value;
      var filtradas = estado === 'all' || !estado
        ? facturasCache
        : facturasCache.filter(function (f) { return f.estado === estado; });
      renderTablaFacturas(filtradas);
    });

  /* Role-based init */
  document.addEventListener('roleChanged', function (e) {
    _adminMode = esAdminSistema();
    _updateAdminUI();
  });

  cargarTasas();
  cargarFacturas();
});

window.renderForRole = function (rol) {
  _adminMode = esAdminSistema();
  _updateAdminUI();
};

function _updateAdminUI() {
  document.querySelectorAll('.admin-only').forEach(function (el) {
    el.style.display = _adminMode ? '' : 'none';
  });
  if (_adminMode) {
    cargarFolios();
    cargarTerceros();
  }
}

/* ── Tab switching ────────────────────────────────────────────────────────── */
function switchTab(tabId) {
  document.querySelectorAll('.pagos-tab').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function (p) { p.style.display = 'none'; });

  var btn = document.querySelector('.pagos-tab[data-tab="' + tabId + '"]');
  if (btn) btn.classList.add('active');

  var panel = document.getElementById('tab-' + tabId);
  if (panel) panel.style.display = '';

  if (tabId === 'facturas') cargarFacturas();
  if (tabId === 'folios')   cargarFolios();
  if (tabId === 'tasas')    cargarTasas();
  if (tabId === 'terceros') cargarTerceros();
}

/* ── BCV Rate loader ──────────────────────────────────────────────────────── */
function cargarTasas() {
  fetch('/api/pagos/tasas', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _tasas = data.tasas || [];
      var ultima = data.ultima;
      if (ultima) {
        _bcvRate = parseFloat(ultima.usd);
        var usdEl    = document.getElementById('bcv-usd-rate');
        var eurEl    = document.getElementById('bcv-eur-rate');
        var fechaEl  = document.getElementById('bcv-fecha');
        if (usdEl)   usdEl.textContent   = _bcvRate.toFixed(2) + ' Bs/$';
        if (eurEl)   eurEl.textContent   = parseFloat(ultima.eur).toFixed(2) + ' Bs/€';
        if (fechaEl) fechaEl.textContent = 'Actualizado: ' + new Date(ultima.fecha_tasa).toLocaleDateString('es-VE');

        var vigUsd   = document.getElementById('tasa-vigente-usd');
        var vigEur   = document.getElementById('tasa-vigente-eur');
        var vigFecha = document.getElementById('tasa-vigente-fecha');
        if (vigUsd)   vigUsd.textContent   = _bcvRate.toFixed(2);
        if (vigEur)   vigEur.textContent   = parseFloat(ultima.eur).toFixed(2);
        if (vigFecha) vigFecha.textContent = 'Fecha: ' + new Date(ultima.fecha_tasa).toLocaleDateString('es-VE');

        /* Pre-fill date input for admin */
        var fechaInput = document.getElementById('tasa-fecha');
        if (fechaInput && !fechaInput.value) {
          fechaInput.value = new Date().toISOString().split('T')[0];
        }
      }
      _renderTasasTable();
    })
    .catch(function () { /* silently fail — banner stays empty */ });
}

function _renderTasasTable() {
  var tbody = document.getElementById('tasas-body');
  if (!tbody) return;
  if (_tasas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="table-empty">Sin tasas registradas.</td></tr>';
    return;
  }
  tbody.innerHTML = _tasas.map(function (t) {
    var fecha = new Date(t.fecha_tasa).toLocaleDateString('es-VE');
    return '<tr><td>' + fecha + '</td>' +
           '<td class="mono">' + parseFloat(t.usd).toFixed(2) + '</td>' +
           '<td class="mono">' + parseFloat(t.eur).toFixed(2) + '</td></tr>';
  }).join('');
}

window.registrarTasa = function () {
  var fecha = (document.getElementById('tasa-fecha') || {}).value;
  var usd   = parseFloat((document.getElementById('tasa-usd')   || {}).value);
  var eur   = parseFloat((document.getElementById('tasa-eur')   || {}).value);

  if (!fecha || isNaN(usd) || isNaN(eur)) {
    showToast('Complete todos los campos de la tasa', 'warning'); return;
  }

  fetch('/api/pagos/tasas', {
    method:  'POST',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({ fecha_tasa: fecha, usd: usd, eur: eur })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Tasa registrada exitosamente', 'success');
      cargarTasas();
    })
    .catch(function () { showToast('Error al registrar la tasa', 'error'); });
};

/* ── Terceros ─────────────────────────────────────────────────────────────── */
function cargarTerceros() {
  fetch('/api/pagos/terceros', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _terceros = data.terceros || [];
      _renderTercerosTable();
      _populateTercerosSelect();
    })
    .catch(function () {});
}

function _renderTercerosTable() {
  var tbody = document.getElementById('terceros-body');
  if (!tbody) return;
  if (_terceros.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="table-empty">Sin terceros registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = _terceros.map(function (t) {
    return '<tr>' +
      '<td><code style="font-size:.78rem;">' + _esc(t.rif) + '</code></td>' +
      '<td>' + _esc(t.razon_social) + '</td>' +
      '<td><button class="btn btn-danger btn-sm" onclick="eliminarTercero(\'' + _esc(t.rif) + '\')">Eliminar</button></td>' +
    '</tr>';
  }).join('');
}

function _populateTercerosSelect() {
  var sel = document.getElementById('generar-rif-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">Sin tercero (factura personal)</option>';
  _terceros.forEach(function (t) {
    sel.innerHTML += '<option value="' + _esc(t.rif) + '">' + _esc(t.razon_social) + ' (' + _esc(t.rif) + ')</option>';
  });
}

window.registrarTercero = function () {
  var rif    = ((document.getElementById('tercero-rif')   || {}).value || '').trim();
  var razon  = ((document.getElementById('tercero-razon') || {}).value || '').trim();
  if (!rif || !razon) { showToast('Complete RIF y Razón Social', 'warning'); return; }

  fetch('/api/pagos/terceros', {
    method:  'POST',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({ rif: rif, razon_social: razon })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Tercero registrado exitosamente', 'success');
      document.getElementById('tercero-rif').value   = '';
      document.getElementById('tercero-razon').value = '';
      cargarTerceros();
    })
    .catch(function () { showToast('Error al registrar tercero', 'error'); });
};

window.eliminarTercero = function (rif) {
  if (!confirm('¿Eliminar el tercero ' + rif + '?')) return;
  fetch('/api/pagos/terceros/' + encodeURIComponent(rif), {
    method:  'DELETE',
    headers: _authHeaders()
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Tercero eliminado', 'success');
      cargarTerceros();
    })
    .catch(function () { showToast('Error al eliminar', 'error'); });
};

/* ── Facturas ─────────────────────────────────────────────────────────────── */
function cargarFacturas() {
  fetch('/api/pagos/facturas', { headers: _authHeaders() })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      facturasCache = data.facturas || [];
      _facturas = facturasCache;
      renderTablaFacturas(facturasCache);
      makeTableSortable('facturas-table');
    })
    .catch(function (err) {
      console.error('Error al cargar facturas:', err);
      showToast('Error al cargar facturas. Verifica la conexión.', 'error');
    });
}

var ESTADO_BADGE = {
  'Gratuito':  'badge-success',
  'Pagada':    'badge-success',
  'Parcial':   'badge-warning',
  'Pendiente': 'badge-danger'
};

function renderTablaFacturas(lista) {
  var tbody = document.getElementById('facturas-body');
  if (!tbody) return;

  var datos = lista || facturasCache;

  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No hay facturas que coincidan.</td></tr>';
    return;
  }

  tbody.innerHTML = datos.map(function (f) {
    var badgeCls = ESTADO_BADGE[f.estado] || 'badge-info';
    var fecha    = f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es-VE') : '—';
    var total    = '$' + parseFloat(f.monto_total  || 0).toFixed(2);
    var pagado   = '$' + parseFloat(f.total_pagado || 0).toFixed(2);
    var saldo    = '$' + parseFloat(f.saldo        || 0).toFixed(2);

    var pagarBtn = (f.estado === 'Pagada' || f.estado === 'Gratuito')
      ? '<button class="btn btn-sm" disabled style="opacity:0.5">' + (f.estado === 'Gratuito' ? 'Sin costo ✓' : 'Pagada ✓') + '</button>'
      : '<button class="btn btn-primary btn-sm" onclick="abrirPago(\'' + f.id_factura + '\',\'' + _esc(f.servicio) + '\',' + parseFloat(f.saldo || 0).toFixed(2) + ')">Pagar</button>';

    return '<tr>' +
      '<td><code style="font-size:.78rem;">' + _esc(f.id_factura) + '</code></td>' +
      '<td>' + _esc(f.servicio || '—') + '</td>' +
      '<td>' + fecha + '</td>' +
      '<td class="mono">' + total + '</td>' +
      '<td class="mono" style="color:var(--color-success);">' + pagado + '</td>' +
      '<td class="mono" style="color:var(--color-warning);">' + saldo + '</td>' +
      '<td><span class="badge ' + badgeCls + '">' + _esc(f.estado) + '</span></td>' +
      '<td><div style="display:flex;gap:var(--space-2);">' +
        '<button class="btn btn-secondary btn-sm" onclick="verDetalleFactura(\'' + f.id_factura + '\')">Ver detalle</button>' +
        pagarBtn +
      '</div></td>' +
    '</tr>';
  }).join('');

  makePaginated('facturas-table', 8);
}

/* ── Invoice detail modal ─────────────────────────────────────────────────── */
window.verDetalleFactura = function (idFactura) {
  var body = document.getElementById('factura-detalle-body');
  body.innerHTML = '<p style="padding:var(--space-5);text-align:center;color:var(--color-text-muted);">Cargando...</p>';
  openModal('factura-detalle-modal');

  fetch('/api/pagos/facturas/' + idFactura, { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) { _renderDetalleFactura(data); })
    .catch(function () {
      body.innerHTML = '<p style="padding:var(--space-4);color:var(--color-danger);text-align:center;">Error al cargar el detalle.</p>';
    });
};

function _renderDetalleFactura(data) {
  var fac    = data.factura || {};
  var items  = data.items   || [];
  var pagos  = data.pagos   || [];

  var estadoInfo = _ESTADO_PAGO[fac.estado] || _ESTADO_PAGO['default'];
  var fecha = fac.fecha_emision ? new Date(fac.fecha_emision).toLocaleDateString('es-VE') : '—';

  var itemsHtml = items.length === 0
    ? '<p style="color:var(--color-text-muted);">Sin ítems registrados.</p>'
    : '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="border-bottom:2px solid var(--color-border);">' +
          '<th style="text-align:left;padding:.4rem .5rem;font-size:.75rem;color:var(--color-text-muted);">CONCEPTO</th>' +
          '<th style="text-align:center;padding:.4rem;font-size:.75rem;color:var(--color-text-muted);">CANT.</th>' +
          '<th style="text-align:right;padding:.4rem .5rem;font-size:.75rem;color:var(--color-text-muted);">PRECIO</th>' +
          '<th style="text-align:right;padding:.4rem .5rem;font-size:.75rem;color:var(--color-text-muted);">IMP.</th>' +
          '<th style="text-align:right;padding:.4rem .5rem;font-size:.75rem;color:var(--color-text-muted);">TOTAL</th>' +
        '</tr></thead><tbody>' +
        items.map(function (it) {
          return '<tr style="border-bottom:1px solid var(--color-border);">' +
            '<td style="padding:.4rem .5rem;font-size:.875rem;">' + _esc(it.concepto) + '</td>' +
            '<td style="text-align:center;padding:.4rem;">' + it.cantidad + '</td>' +
            '<td style="text-align:right;padding:.4rem .5rem;font-family:var(--font-mono);font-size:.875rem;">$' + parseFloat(it.precio).toFixed(2) + '</td>' +
            '<td style="text-align:right;padding:.4rem .5rem;font-size:.875rem;">' + (parseFloat(it.impuesto)*100).toFixed(0) + '%</td>' +
            '<td style="text-align:right;padding:.4rem .5rem;font-family:var(--font-mono);font-size:.875rem;font-weight:600;">$' + parseFloat(it.subtotal).toFixed(2) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';

  var pagosHtml = pagos.length === 0
    ? '<p style="color:var(--color-text-muted);">Sin pagos registrados.</p>'
    : pagos.map(function (p) {
        var fPago = new Date(p.fecha_pago).toLocaleDateString('es-VE');
        var mLbl  = _METODO_LABEL[p.metodo] || p.metodo;
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem;border-bottom:1px solid var(--color-border);">' +
          '<div>' +
            '<code style="font-size:.75rem;">' + p.id_pago + '</code>' +
            '<span class="badge badge-gray" style="margin-left:.5rem;font-size:.72rem;">' + mLbl + '</span>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-family:var(--font-mono);font-weight:700;color:var(--color-success);">$' + parseFloat(p.monto).toFixed(2) + '</div>' +
            '<div style="font-size:.75rem;color:var(--color-text-muted);">' + fPago + '</div>' +
          '</div>' +
        '</div>';
      }).join('');

  document.getElementById('factura-detalle-body').innerHTML =
    '<div style="padding:var(--space-4);">' +

    '<div class="info-box" style="margin-bottom:var(--space-4);">' +
    '<div class="info-box-title">Información de Factura</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td class="det-label">ID</td><td><code style="font-size:.8rem;">' + fac.id_factura + '</code></td></tr>' +
      '<tr><td class="det-label">Servicio</td><td>' + _esc(fac.servicio) + '</td></tr>' +
      '<tr><td class="det-label">Fecha emisión</td><td>' + fecha + '</td></tr>' +
      '<tr><td class="det-label">Total</td><td><strong>$' + parseFloat(fac.monto_total || 0).toFixed(2) + '</strong></td></tr>' +
      '<tr><td class="det-label">Pagado</td><td style="color:var(--color-success);">$' + parseFloat(fac.total_pagado || 0).toFixed(2) + '</td></tr>' +
      '<tr><td class="det-label">Saldo</td><td style="color:var(--color-warning);font-weight:700;">$' + parseFloat(fac.saldo || 0).toFixed(2) + '</td></tr>' +
      '<tr><td class="det-label">Estado</td><td><span class="badge ' + estadoInfo.cls + '">' + estadoInfo.label + '</span></td></tr>' +
    '</table></div>' +

    '<style>.det-label{color:var(--color-text-muted);padding:.3rem .5rem;white-space:nowrap;width:130px;vertical-align:top;}td{padding:.3rem .5rem;}</style>' +

    '<div style="margin-bottom:var(--space-4);">' +
      '<div style="font-weight:600;margin-bottom:var(--space-3);">Ítems de Consumo</div>' +
      itemsHtml +
    '</div>' +

    '<div style="margin-bottom:var(--space-4);">' +
      '<div style="font-weight:600;margin-bottom:var(--space-3);">Historial de Pagos</div>' +
      pagosHtml +
    '</div>' +

    (fac.estado !== 'Pagada'
      ? '<div class="modal-footer">' +
          '<button class="btn btn-primary" onclick="closeModal(\'factura-detalle-modal\');abrirPago(\'' + fac.id_factura + '\',\'' + _esc(fac.servicio) + '\',' + parseFloat(fac.saldo || 0).toFixed(2) + ')">Registrar Pago</button>' +
        '</div>'
      : '') +
    '</div>';
}

/* ── Payment trigger ──────────────────────────────────────────────────────── */
window.abrirPago = function (idFactura, concepto, saldo) {
  PaymentModal.open({
    facturaId:  idFactura,
    invoiceId:  idFactura,
    concept:    concepto,
    amountUSD:  parseFloat(saldo),
    bcvRate:    _bcvRate || 37.68,
    onSuccess:  null
  });
};

window.onPaymentComplete = function (data) {
  if (data.is_paid) {
    showToast('¡Factura pagada completamente!', 'success');
  } else {
    showToast('Abono registrado. Saldo restante: $' + parseFloat(data.saldo || 0).toFixed(2), 'success');
  }
  cargarFacturas();
};

/* ── Folios ───────────────────────────────────────────────────────────────── */
function cargarFolios() {
  fetch('/api/pagos/folios', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _folios = data.folios || [];
      _renderFoliosTable();
      makeTableSortable('folios-table');
      makePaginated('folios-table', 8);
    })
    .catch(function () { showToast('Error al cargar folios', 'error'); });
}

function _renderFoliosTable() {
  var tbody = document.getElementById('folios-body');
  if (!tbody) return;

  if (_folios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Sin folios registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = _folios.map(function (f) {
    var estado = _FOLIO_ESTADO[f.estado_folio] || _FOLIO_ESTADO['default'];
    var total  = '$' + parseFloat(f.total_items || 0).toFixed(2);

    var acciones = '<button class="btn btn-secondary btn-sm" onclick="verItemsFolio(\'' + _esc(f.id_folio) + '\',\'' + _esc(f.estado_folio) + '\')">Ver ítems</button>';
    if (f.estado_folio === 'Abierto' && !f.tiene_factura) {
      acciones += ' <button class="btn btn-primary btn-sm" onclick="abrirGenerarFactura(\'' + _esc(f.id_folio) + '\',' + parseFloat(f.total_items||0).toFixed(2) + ')">Generar factura</button>';
    }

    return '<tr>' +
      '<td><code style="font-size:.78rem;">' + _esc(f.id_folio) + '</code></td>' +
      '<td><code style="font-size:.75rem;">' + _esc(f.id_solicitud) + '</code></td>' +
      '<td>' + _esc(f.nombre_miembro || '—') + '</td>' +
      '<td>' + _esc(f.nombre_servicio) + '</td>' +
      '<td style="text-align:center;">' + (f.num_items || 0) + '</td>' +
      '<td class="mono">' + total + '</td>' +
      '<td><span class="badge ' + estado.cls + '">' + estado.label + '</span></td>' +
      '<td><div style="display:flex;gap:var(--space-2);">' + acciones + '</div></td>' +
    '</tr>';
  }).join('');
}

/* ── Create folio modal ───────────────────────────────────────────────────── */
window.abrirCrearFolio = function () {
  var sel = document.getElementById('folio-sol-select');
  sel.innerHTML = '<option value="">Cargando...</option>';

  fetch('/api/pagos/solicitudes', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var soles = data.solicitudes || [];
      sel.innerHTML = '<option value="">Seleccione una solicitud...</option>';
      soles.forEach(function (s) {
        var fecha = new Date(s.fecha_apertura).toLocaleDateString('es-VE');
        sel.innerHTML += '<option value="' + _esc(s.id_solicitud) + '">' +
          _esc(s.id_solicitud) + ' — ' + _esc(s.nombre_servicio) + ' (' + _esc(s.nombre_miembro) + ', ' + fecha + ')</option>';
      });
    })
    .catch(function () {
      sel.innerHTML = '<option value="">Error al cargar solicitudes</option>';
    });

  openModal('crear-folio-modal');
};

window.confirmarCrearFolio = function () {
  var idSol = (document.getElementById('folio-sol-select') || {}).value;
  if (!idSol) { showToast('Seleccione una solicitud', 'warning'); return; }

  var btn = document.getElementById('btn-crear-folio');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }

  fetch('/api/pagos/folios', {
    method:  'POST',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({ id_solicitud: idSol })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (btn) { btn.disabled = false; btn.textContent = 'Crear Folio'; }
      if (data.error) { showToast(data.error, 'error'); return; }
      closeModal('crear-folio-modal');
      showToast('Folio creado: ' + data.id_folio, 'success');
      cargarFolios();
    })
    .catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Crear Folio'; }
      showToast('Error al crear el folio', 'error');
    });
};

/* ── Items management modal ───────────────────────────────────────────────── */
window.verItemsFolio = function (idFolio, estadoFolio) {
  _currentFolioId = idFolio;
  document.getElementById('folio-items-title').textContent = 'Ítems del Folio — ' + idFolio;
  document.getElementById('folio-items-body').innerHTML =
    '<p style="padding:var(--space-5);text-align:center;color:var(--color-text-muted);">Cargando...</p>';
  openModal('folio-items-modal');

  fetch('/api/pagos/folios/' + idFolio + '/items', { headers: _authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) { _renderFolioItems(data.items || [], idFolio, estadoFolio); })
    .catch(function () {
      document.getElementById('folio-items-body').innerHTML =
        '<p style="padding:var(--space-4);color:var(--color-danger);text-align:center;">Error al cargar ítems.</p>';
    });
};

function _renderFolioItems(items, idFolio, estadoFolio) {
  var estaAbierto = estadoFolio === 'Abierto';
  var total = items.reduce(function (acc, it) { return acc + parseFloat(it.total_item || 0); }, 0);

  var itemsHtml = items.length === 0
    ? '<p style="color:var(--color-text-muted);padding:var(--space-3);">Sin ítems. Agregue el primero.</p>'
    : '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="border-bottom:2px solid var(--color-border);">' +
          '<th style="text-align:left;padding:.4rem .5rem;font-size:.75rem;color:var(--color-text-muted);">#</th>' +
          '<th style="text-align:left;padding:.4rem .5rem;font-size:.75rem;color:var(--color-text-muted);">CONCEPTO</th>' +
          '<th style="text-align:center;padding:.4rem;font-size:.75rem;color:var(--color-text-muted);">CANT.</th>' +
          '<th style="text-align:right;padding:.4rem;font-size:.75rem;color:var(--color-text-muted);">PRECIO</th>' +
          '<th style="text-align:right;padding:.4rem;font-size:.75rem;color:var(--color-text-muted);">IMP.</th>' +
          '<th style="text-align:right;padding:.4rem;font-size:.75rem;color:var(--color-text-muted);">TOTAL</th>' +
          (estaAbierto ? '<th></th>' : '') +
        '</tr></thead><tbody>' +
        items.map(function (it) {
          return '<tr style="border-bottom:1px solid var(--color-border);">' +
            '<td style="padding:.4rem .5rem;font-size:.78rem;color:var(--color-text-muted);">' + it.numero + '</td>' +
            '<td style="padding:.4rem .5rem;font-size:.875rem;">' + _esc(it.concepto) + '</td>' +
            '<td style="text-align:center;padding:.4rem;">' + it.cantidad + '</td>' +
            '<td style="text-align:right;padding:.4rem;font-family:var(--font-mono);font-size:.875rem;">$' + parseFloat(it.precio).toFixed(2) + '</td>' +
            '<td style="text-align:right;padding:.4rem;font-size:.875rem;">' + (parseFloat(it.impuesto)*100).toFixed(0) + '%</td>' +
            '<td style="text-align:right;padding:.4rem;font-family:var(--font-mono);font-size:.875rem;font-weight:600;">$' + parseFloat(it.total_item).toFixed(2) + '</td>' +
            (estaAbierto
              ? '<td style="padding:.4rem;"><button class="btn btn-danger btn-sm" onclick="eliminarItem(\'' + idFolio + '\',' + it.numero + ')">×</button></td>'
              : '') +
          '</tr>';
        }).join('') +
        '<tr style="border-top:2px solid var(--color-border);">' +
          '<td colspan="' + (estaAbierto ? '5' : '5') + '" style="padding:.5rem;font-weight:700;text-align:right;">TOTAL:</td>' +
          '<td style="text-align:right;padding:.5rem;font-family:var(--font-mono);font-weight:700;font-size:1rem;">$' + total.toFixed(2) + '</td>' +
          (estaAbierto ? '<td></td>' : '') +
        '</tr>' +
        '</tbody></table>';

  var addFormHtml = estaAbierto
    ? '<div style="margin-top:var(--space-4);padding:var(--space-4);background:var(--color-bg);border-radius:var(--radius-md);border:1px solid var(--color-border);">' +
        '<div style="font-weight:600;margin-bottom:var(--space-3);">Agregar Ítem</div>' +
        '<div class="form-group"><label class="form-label">Concepto</label><input class="form-input" id="item-concepto" placeholder="Descripción del cargo"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-3);">' +
          '<div class="form-group"><label class="form-label">Cantidad</label><input class="form-input" type="number" id="item-cantidad" min="1" value="1"></div>' +
          '<div class="form-group"><label class="form-label">Precio ($)</label><input class="form-input" type="number" id="item-precio" min="0" step="0.01" placeholder="0.00"></div>' +
          '<div class="form-group"><label class="form-label">Impuesto (%)</label><input class="form-input" type="number" id="item-impuesto" min="0" max="100" step="1" value="16"></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" onclick="agregarItem(\'' + idFolio + '\')">+ Agregar ítem</button>' +
      '</div>'
    : '<div class="info-box" style="margin-top:var(--space-4);">ℹ Este folio está cerrado. No se pueden agregar ni eliminar ítems.</div>';

  document.getElementById('folio-items-body').innerHTML =
    '<div style="padding:var(--space-4);">' + itemsHtml + addFormHtml + '</div>';
}

window.agregarItem = function (idFolio) {
  var concepto  = ((document.getElementById('item-concepto')  || {}).value || '').trim();
  var cantidad  = parseInt((document.getElementById('item-cantidad')  || {}).value);
  var precio    = parseFloat((document.getElementById('item-precio')   || {}).value);
  var impuesto  = parseFloat((document.getElementById('item-impuesto') || {}).value) / 100;

  if (!concepto || isNaN(cantidad) || isNaN(precio)) {
    showToast('Complete concepto, cantidad y precio', 'warning'); return;
  }

  fetch('/api/pagos/folios/' + idFolio + '/items', {
    method:  'POST',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({ concepto: concepto, cantidad: cantidad, precio: precio, impuesto: impuesto })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Ítem agregado', 'success');
      verItemsFolio(idFolio, 'Abierto');
      cargarFolios();
    })
    .catch(function () { showToast('Error al agregar ítem', 'error'); });
};

window.eliminarItem = function (idFolio, numero) {
  if (!confirm('¿Eliminar el ítem #' + numero + '?')) return;
  fetch('/api/pagos/folios/' + idFolio + '/items/' + numero, {
    method:  'DELETE',
    headers: _authHeaders()
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { showToast(data.error, 'error'); return; }
      showToast('Ítem eliminado', 'success');
      verItemsFolio(idFolio, 'Abierto');
      cargarFolios();
    })
    .catch(function () { showToast('Error al eliminar ítem', 'error'); });
};

/* ── Generate invoice modal ───────────────────────────────────────────────── */
var _folioParaFactura = null;

window.abrirGenerarFactura = function (idFolio, totalItems) {
  _folioParaFactura = idFolio;
  document.getElementById('generar-factura-info').innerHTML =
    '<div class="info-box-title">Resumen del Folio</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="color:var(--color-text-muted);padding:.3rem .5rem;width:120px;">Folio</td><td><code>' + _esc(idFolio) + '</code></td></tr>' +
      '<tr><td style="color:var(--color-text-muted);padding:.3rem .5rem;">Monto total</td><td><strong>$' + parseFloat(totalItems).toFixed(2) + '</strong></td></tr>' +
    '</table>';

  _populateTercerosSelect();
  openModal('generar-factura-modal');
};

window.confirmarGenerarFactura = function () {
  if (!_folioParaFactura) return;
  var rif = (document.getElementById('generar-rif-select') || {}).value || null;
  var btn = document.getElementById('btn-generar-fac');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }

  fetch('/api/pagos/folios/' + _folioParaFactura + '/factura', {
    method:  'POST',
    headers: _authJsonHeaders(),
    body:    JSON.stringify({ rif: rif || undefined })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (btn) { btn.disabled = false; btn.textContent = 'Generar Factura'; }
      if (data.error) { showToast(data.error, 'error'); return; }
      closeModal('generar-factura-modal');
      showToast('Factura generada: ' + data.id_factura + ' ($' + parseFloat(data.monto).toFixed(2) + ')', 'success');
      _folioParaFactura = null;
      cargarFolios();
      cargarFacturas();
    })
    .catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Generar Factura'; }
      showToast('Error al generar la factura', 'error');
    });
};

/* ── String helpers ───────────────────────────────────────────────────────── */
function _esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
