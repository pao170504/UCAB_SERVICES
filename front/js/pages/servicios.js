/* servicios.js */
var _resData = { serviceName: '', location: '', rateUSD: 0, date: '', bloque: '', academicUse: false, subject: '', companions: [] };
var _resStep = 1;

document.addEventListener('DOMContentLoaded', function () {
  makeTableSortable('inventory-table');
  makeTableSearchable('inventory-table', 'inventory-search');

  document.querySelectorAll('.tab-pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-pill').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  var resetBtn = document.getElementById('filter-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      document.querySelectorAll('.filter-bar select').forEach(function (s) { s.selectedIndex = 0; });
    });
  }

  renderForRole(window.currentRole || 'estudiante');
});

window.renderForRole = function (role) {
  _applyTariffLabels(role);
  _applyDocenteBadges(role);
  _applyUsoAcademico(role);
  _applyButtonLabels(role);
};

function _applyTariffLabels(role) {
  var t1 = document.getElementById('tariff-1');
  var t3 = document.getElementById('tariff-3');
  if (role === 'profesor') {
    if (t1) t1.innerHTML = '<span>Tarifa Empleado: <strong>$16/hr</strong></span>';
    if (t3) t3.innerHTML = '<span>Tarifa Empleado: <strong>$5/sesión</strong></span>';
  } else {
    if (t1) t1.innerHTML = '<span>Miembro Activo: <strong>$16/hr</strong></span><span>Externo: <strong>$45/hr</strong></span>';
    if (t3) t3.innerHTML = '<span>Miembro Activo: <strong>$5/sesión</strong></span><span>Externo: <strong>$20/sesión</strong></span>';
  }
}

function _applyDocenteBadges(role) {
  ['docente-badge-1', 'docente-badge-3'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = (role === 'profesor') ? '' : 'none';
  });
}

function _applyUsoAcademico(role) {
  var col = document.getElementById('col-uso-academico');
  if (col) col.style.display = (role === 'profesor') ? '' : 'none';
  document.querySelectorAll('.uso-academico-col').forEach(function (td) {
    td.style.display = (role === 'profesor') ? '' : 'none';
  });
}

function _applyButtonLabels(role) {
  var btn1 = document.getElementById('btn-reservar-1');
  var btn3 = document.getElementById('btn-reservar-3');
  if (role === 'profesor') {
    if (btn1) btn1.textContent = 'RESERVAR PARA CLASE';
    if (btn3) btn3.textContent = 'RESERVAR';
  } else {
    if (btn1) btn1.textContent = 'RESERVAR AHORA';
    if (btn3) btn3.textContent = 'SOLICITAR';
  }
}

/* ---- Reservation modal ---- */
function openReservation(name, location, rate) {
  _resData = { serviceName: name, location: location, rateUSD: rate, date: '', bloque: '', academicUse: false, subject: '', companions: [] };
  _resStep = 1;
  _renderResModal();
  openModal('reservation-modal');
}
window.openReservation = openReservation;

function _renderResModal() {
  _renderStepIndicator();
  switch (_resStep) {
    case 1: _renderStep1(); break;
    case 2: _renderStep2(); break;
    case 3: _renderStep3(); break;
  }
}

function _renderStepIndicator() {
  var steps = ['Horario', 'Acompañantes', 'Resumen'];
  var html = '';
  steps.forEach(function (label, i) {
    var n       = i + 1;
    var done    = n < _resStep;
    var current = n === _resStep;
    var dotCls  = done ? ' completed' : current ? ' active' : '';
    var lblCls  = current ? ' active' : '';
    html += '<div class="step-item">';
    html += '<div class="step-dot' + dotCls + '">' + (done ? '✓' : n) + '</div>';
    html += '<div class="step-label' + lblCls + '">' + label + '</div>';
    html += '</div>';
    if (i < steps.length - 1) html += '<div class="step-line' + (done ? ' completed' : '') + '"></div>';
  });
  document.getElementById('res-steps').innerHTML = html;
}

function _renderStep1() {
  var isProfesor = (window.currentRole === 'profesor');
  var academicBlock = isProfesor ? (
    '<div class="form-group" style="margin-top:1rem;">' +
    '<label class="form-label" style="display:flex;align-items:center;gap:.5rem;cursor:pointer;">' +
    '<input type="checkbox" id="res-academic" style="width:16px;height:16px;" ' + (_resData.academicUse ? 'checked' : '') + '>' +
    ' Uso académico</label></div>' +
    '<div id="subject-row" class="form-group" style="' + (_resData.academicUse ? '' : 'display:none;') + '">' +
    '<label class="form-label">Asignatura</label>' +
    '<select class="form-select" id="res-subject">' +
    '<option value="">Seleccionar...</option>' +
    '<option' + (_resData.subject==='Bases de Datos I' ? ' selected' : '') + '>Bases de Datos I</option>' +
    '<option' + (_resData.subject==='Bases de Datos II' ? ' selected' : '') + '>Bases de Datos II</option>' +
    '<option' + (_resData.subject==='Sistemas de Información' ? ' selected' : '') + '>Sistemas de Información</option>' +
    '<option' + (_resData.subject==='Programación I' ? ' selected' : '') + '>Programación I</option>' +
    '</select></div>'
  ) : '';

  document.getElementById('res-body').innerHTML =
    '<div class="form-group">' +
    '<label class="form-label">Servicio</label>' +
    '<div style="font-weight:600;">' + _resData.serviceName + ' <small style="font-weight:400;color:var(--color-text-muted);">— ' + _resData.location + '</small></div>' +
    '</div>' +
    '<div class="form-row">' +
    '<div class="form-group">' +
    '<label class="form-label">Fecha</label>' +
    '<input type="date" class="form-input" id="res-date" value="' + _resData.date + '">' +
    '</div>' +
    '<div class="form-group">' +
    '<label class="form-label">Bloque horario</label>' +
    '<select class="form-select" id="res-bloque">' +
    '<option value="">Seleccionar...</option>' +
    ['07:00–09:00','09:00–11:00','11:00–13:00','14:00–16:00','16:00–18:00'].map(function (b) {
      return '<option' + (_resData.bloque===b ? ' selected' : '') + '>' + b + '</option>';
    }).join('') +
    '</select>' +
    '</div>' +
    '</div>' +
    academicBlock +
    '<div class="modal-footer">' +
    '<button class="btn btn-secondary" onclick="closeModal(\'reservation-modal\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="resNext1()">Continuar →</button>' +
    '</div>';

  if (isProfesor) {
    var chk = document.getElementById('res-academic');
    if (chk) {
      chk.addEventListener('change', function () {
        var row = document.getElementById('subject-row');
        if (row) row.style.display = chk.checked ? '' : 'none';
      });
    }
  }
}

function resNext1() {
  var dateEl   = document.getElementById('res-date');
  var bloqueEl = document.getElementById('res-bloque');
  if (!dateEl || !dateEl.value || !bloqueEl || !bloqueEl.value) {
    showToast('Por favor seleccione fecha y bloque horario.', 'warning'); return;
  }
  _resData.date   = dateEl.value;
  _resData.bloque = bloqueEl.value;
  var chk = document.getElementById('res-academic');
  if (chk) {
    _resData.academicUse = chk.checked;
    var subjEl = document.getElementById('res-subject');
    _resData.subject = subjEl ? subjEl.value : '';
  }
  _resStep = 2;
  _renderResModal();
}
window.resNext1 = resNext1;

function _renderStep2() {
  var rows = _resData.companions.map(function (c, i) { return _companionRow(i, c.nombre, c.cedula); }).join('');

  document.getElementById('res-body').innerHTML =
    '<div class="form-group">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
    '<label class="form-label" style="margin:0;">Acompañantes <small style="color:var(--color-text-muted);">(máx. 5)</small></label>' +
    '<button class="btn btn-secondary btn-sm" id="btn-add-comp" onclick="resAddCompanion()"' + (_resData.companions.length >= 5 ? ' disabled' : '') + '>+ Agregar</button>' +
    '</div>' +
    '</div>' +
    '<div id="companion-list">' + rows + '</div>' +
    '<p style="margin-top:.75rem;font-size:.85rem;color:var(--color-text-muted);">¿No lleva acompañantes? <a href="#" onclick="resSkipCompanions();return false;" style="color:var(--color-primary);">Continuar sin acompañantes</a></p>' +
    '<div class="modal-footer">' +
    '<button class="btn btn-secondary" onclick="resBack()">← Atrás</button>' +
    '<button class="btn btn-primary" onclick="resNext2()">Continuar →</button>' +
    '</div>';
}

function _companionRow(idx, nombre, cedula) {
  return '<div class="companion-row" id="comp-row-' + idx + '" style="display:flex;gap:.5rem;margin-bottom:.5rem;">' +
    '<input class="form-input" placeholder="Nombre completo" id="comp-name-' + idx + '" value="' + (nombre||'') + '" style="flex:1;">' +
    '<input class="form-input" placeholder="Cédula" id="comp-doc-' + idx + '" value="' + (cedula||'') + '" style="width:130px;">' +
    '<button class="btn-icon" style="color:var(--color-danger);font-size:1.2rem;line-height:1;" onclick="resRemoveCompanion(' + idx + ')">×</button>' +
    '</div>';
}

function resAddCompanion() {
  if (_resData.companions.length >= 5) { showToast('Máximo 5 acompañantes.', 'warning'); return; }
  var idx = _resData.companions.length;
  _resData.companions.push({ nombre: '', cedula: '' });
  var list = document.getElementById('companion-list');
  if (list) {
    var div = document.createElement('div');
    div.innerHTML = _companionRow(idx, '', '');
    list.appendChild(div.firstElementChild);
  }
  if (_resData.companions.length >= 5) {
    var btn = document.getElementById('btn-add-comp');
    if (btn) btn.disabled = true;
  }
}
window.resAddCompanion = resAddCompanion;

function resRemoveCompanion(idx) {
  _collectCompanions();
  _resData.companions.splice(idx, 1);
  _renderResModal();
}
window.resRemoveCompanion = resRemoveCompanion;

function resSkipCompanions() {
  _resData.companions = [];
  _resStep = 3;
  _renderResModal();
}
window.resSkipCompanions = resSkipCompanions;

function resBack() {
  _resStep = Math.max(1, _resStep - 1);
  _renderResModal();
}
window.resBack = resBack;

function _collectCompanions() {
  _resData.companions.forEach(function (c, i) {
    var n = document.getElementById('comp-name-' + i);
    var d = document.getElementById('comp-doc-' + i);
    if (n) c.nombre = n.value.trim();
    if (d) c.cedula = d.value.trim();
  });
}

function resNext2() {
  _collectCompanions();
  _resData.companions = _resData.companions.filter(function (c) { return c.nombre; });
  _resStep = 3;
  _renderResModal();
}
window.resNext2 = resNext2;

function _renderStep3() {
  var dateStr    = _resData.date ? new Date(_resData.date + 'T12:00:00').toLocaleDateString('es-VE', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  var companions = _resData.companions.length ? _resData.companions.map(function (c) { return c.nombre; }).join(', ') : 'Ninguno';
  var academicRow = (_resData.academicUse && _resData.subject) ?
    '<tr><td class="sum-label">Asignatura</td><td>' + _resData.subject + '</td></tr>' : '';

  document.getElementById('res-body').innerHTML =
    '<div class="info-box">' +
    '<div class="info-box-title">📋 Resumen de Reserva</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr><td class="sum-label">Servicio</td><td>' + _resData.serviceName + '</td></tr>' +
    '<tr><td class="sum-label">Ubicación</td><td>' + _resData.location + '</td></tr>' +
    '<tr><td class="sum-label">Fecha</td><td>' + dateStr + '</td></tr>' +
    '<tr><td class="sum-label">Bloque</td><td>' + _resData.bloque + '</td></tr>' +
    '<tr><td class="sum-label">Tarifa</td><td><strong>$' + _resData.rateUSD.toFixed(2) + '</strong></td></tr>' +
    academicRow +
    '<tr><td class="sum-label">Acompañantes</td><td>' + companions + '</td></tr>' +
    '</table>' +
    '</div>' +
    '<style>.sum-label{color:var(--color-text-muted);padding:.3rem .5rem;white-space:nowrap;}td{padding:.3rem .5rem;}</style>' +
    '<div class="modal-footer">' +
    '<button class="btn btn-secondary" onclick="resBack()">← Atrás</button>' +
    '<button class="btn btn-primary" onclick="resProceedPayment()">Proceder al pago →</button>' +
    '</div>';
}

function resProceedPayment() {
  closeModal('reservation-modal');
  var invoiceId = '#RES-' + Math.floor(Math.random() * 90000 + 10000);
  PaymentModal.open({
    invoiceId: invoiceId,
    concept: 'Reserva — ' + _resData.serviceName,
    amountUSD: _resData.rateUSD,
    bcvRate: 36.80,
    onSuccess: null
  });
  window.onPaymentComplete = function (data) {
    showToast(
      data.paid ? 'Reserva confirmada exitosamente.' : 'Abono registrado. Saldo pendiente: $' + data.remaining.toFixed(2),
      data.paid ? 'success' : 'info'
    );
  };
}
window.resProceedPayment = resProceedPayment;
