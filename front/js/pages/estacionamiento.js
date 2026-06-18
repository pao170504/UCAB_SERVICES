/* estacionamiento.js */
var _selectedSpotId = null;

var SPOT_DATA = {
  'S-01': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 1 minuto',   ocupacion: '—',      mantFrom: null,       mantTo: null },
  'S-02': { estado: 'ocupado',       sensor: 'Activo y Funcionando', updated: 'Hace 4 minutos',  ocupacion: '02:14:45', mantFrom: null,       mantTo: null },
  'S-03': { estado: 'ocupado',       sensor: 'Activo y Funcionando', updated: 'Hace 8 minutos',  ocupacion: '01:05:20', mantFrom: null,       mantTo: null },
  'S-04': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 2 minutos',  ocupacion: '—',      mantFrom: null,       mantTo: null },
  'S-05': { estado: 'reservado',     sensor: 'Activo y Funcionando', updated: 'Hace 12 minutos', ocupacion: '00:30:00', mantFrom: null,       mantTo: null },
  'S-06': { estado: 'mantenimiento', sensor: 'Fuera de línea',       updated: 'Hace 3 horas',    ocupacion: '—',      mantFrom: '20/06/2026', mantTo: '25/06/2026' },
  'M-01': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 5 minutos',  ocupacion: '—',      mantFrom: null,       mantTo: null },
  'M-02': { estado: 'ocupado',       sensor: 'Activo y Funcionando', updated: 'Hace 20 minutos', ocupacion: '00:45:10', mantFrom: null,       mantTo: null },
  'M-03': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 3 minutos',  ocupacion: '—',      mantFrom: null,       mantTo: null },
  'C-01': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 1 minuto',   ocupacion: '—',      mantFrom: null,       mantTo: null },
  'C-02': { estado: 'ocupado',       sensor: 'Activo y Funcionando', updated: 'Hace 35 minutos', ocupacion: '00:35:00', mantFrom: null,       mantTo: null },
  'P-01': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 2 minutos',  ocupacion: '—',      mantFrom: null,       mantTo: null },
  'P-02': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 7 minutos',  ocupacion: '—',      mantFrom: null,       mantTo: null },
  'S-07': { estado: 'ocupado',       sensor: 'Activo y Funcionando', updated: 'Hace 50 minutos', ocupacion: '00:50:00', mantFrom: null,       mantTo: null },
  'S-08': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Hace 1 minuto',   ocupacion: '—',      mantFrom: null,       mantTo: null },
  'S-09': { estado: 'reservado',     sensor: 'Activo y Funcionando', updated: 'Hace 5 minutos',  ocupacion: '00:10:00', mantFrom: null,       mantTo: null },
  'S-10': { estado: 'libre',         sensor: 'Activo y Funcionando', updated: 'Ahora mismo',     ocupacion: '—',      mantFrom: null,       mantTo: null },
  'S-11': { estado: 'mantenimiento', sensor: 'Fuera de línea',       updated: 'Hace 1 día',      ocupacion: '—',      mantFrom: '18/06/2026', mantTo: '19/06/2026' },
};

document.addEventListener('DOMContentLoaded', function () {
  /* Zone tabs */
  document.querySelectorAll('.tab-pill[data-zone]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab-pill[data-zone]').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  /* Spot clicks */
  document.querySelectorAll('.spot[data-spot]').forEach(function (spot) {
    spot.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.spot').forEach(function (s) { s.classList.remove('selected'); });
      this.classList.add('selected');
      var id   = this.dataset.spot;
      _selectedSpotId = id;
      _showDetailPanel(id);
      _showPopover(this, id);
    });
  });

  /* Close popover on outside click */
  document.addEventListener('click', function (e) {
    var pop = document.getElementById('spot-popover');
    if (pop && pop.style.display !== 'none' && !pop.contains(e.target)) {
      closePopover();
    }
  });

  renderForRole(window.currentRole || 'estudiante');
});

window.renderForRole = function () { /* all roles see same parking view */ };

function _showDetailPanel(id) {
  var data       = SPOT_DATA[id];
  var detailHeader = document.getElementById('spot-detail-header');
  var detailBody   = document.getElementById('spot-detail-body');
  var detailEmpty  = document.getElementById('spot-detail-empty');
  if (!data) return;

  if (detailHeader) detailHeader.textContent = 'Detalle del Puesto — ' + id;
  if (detailEmpty)  detailEmpty.style.display = 'none';
  if (detailBody) {
    detailBody.style.display = 'flex';
    var sensorEl  = document.getElementById('detail-sensor');
    var updatedEl = document.getElementById('detail-updated');
    var timerEl   = document.getElementById('detail-timer');
    var estadoEl  = document.getElementById('detail-estado');
    if (sensorEl)  sensorEl.textContent  = data.sensor;
    if (updatedEl) updatedEl.textContent = data.updated;
    if (timerEl)   timerEl.textContent   = data.ocupacion;
    if (estadoEl) {
      var cls = { libre: 'dot-success', ocupado: 'dot-warning', reservado: 'dot-blue', mantenimiento: 'dot-danger' };
      estadoEl.className = 'dot ' + (cls[data.estado] || 'dot-gray');
    }
  }
}

function _showPopover(spotEl, id) {
  var data = SPOT_DATA[id];
  if (!data) return;

  var pop    = document.getElementById('spot-popover');
  var title  = document.getElementById('pop-title');
  var body   = document.getElementById('pop-body');
  if (!pop) return;

  if (title) title.textContent = 'Puesto ' + id;

  var statusLabel = { libre: '🟢 Libre', ocupado: '🟡 Ocupado', reservado: '🔵 Reservado', mantenimiento: '🔴 Mantenimiento' };
  var html = '<div class="pop-row"><span class="pop-label">Estado</span><span>' + (statusLabel[data.estado] || data.estado) + '</span></div>';
  html += '<div class="pop-row"><span class="pop-label">Sensor</span><span>' + data.sensor + '</span></div>';
  html += '<div class="pop-row"><span class="pop-label">Actualizado</span><span>' + data.updated + '</span></div>';

  if (data.estado === 'ocupado' || data.estado === 'reservado') {
    html += '<div class="pop-row"><span class="pop-label">En puesto</span><span>' + data.ocupacion + '</span></div>';
  }
  if (data.estado === 'mantenimiento' && data.mantFrom) {
    html += '<div class="pop-row"><span class="pop-label">Desde</span><span>' + data.mantFrom + '</span></div>';
    html += '<div class="pop-row"><span class="pop-label">Hasta</span><span>' + data.mantTo + '</span></div>';
  }

  if (data.estado === 'libre') {
    html += '<button class="btn btn-primary btn-full btn-sm" style="margin-top:.75rem;" onclick="openReserveModal(\'' + id + '\')">Reservar este puesto</button>';
  }

  if (body) body.innerHTML = html;

  /* Position popover near spot element */
  var rect = spotEl.getBoundingClientRect();
  pop.style.display = 'block';
  var popW = 220;
  var left = rect.right + 8;
  if (left + popW > window.innerWidth - 16) left = rect.left - popW - 8;
  pop.style.left = Math.max(8, left) + 'px';
  pop.style.top  = Math.max(8, rect.top + window.scrollY) + 'px';
}

function closePopover() {
  var pop = document.getElementById('spot-popover');
  if (pop) pop.style.display = 'none';
  document.querySelectorAll('.spot').forEach(function (s) { s.classList.remove('selected'); });
}
window.closePopover = closePopover;

function openReserveModal(spotId) {
  _selectedSpotId = spotId;
  closePopover();
  var titleEl = document.getElementById('reserve-modal-title');
  if (titleEl) titleEl.textContent = 'Reservar puesto ' + spotId;
  var plateEl = document.getElementById('reserve-plate');
  if (plateEl) plateEl.value = '';
  openModal('reserve-modal');
}
window.openReserveModal = openReserveModal;

function confirmReservation() {
  var plateEl = document.getElementById('reserve-plate');
  var fromEl  = document.getElementById('reserve-from');
  var toEl    = document.getElementById('reserve-to');
  var plate   = plateEl ? plateEl.value.trim().toUpperCase() : '';

  if (!plate) { showToast('Ingrese la placa del vehículo.', 'warning'); return; }
  if (!fromEl.value || !toEl.value || fromEl.value >= toEl.value) {
    showToast('El rango de horario no es válido.', 'warning'); return;
  }

  closeModal('reserve-modal');

  /* Update spot state in map */
  if (_selectedSpotId && SPOT_DATA[_selectedSpotId]) {
    SPOT_DATA[_selectedSpotId].estado   = 'reservado';
    SPOT_DATA[_selectedSpotId].updated  = 'Ahora mismo';
    SPOT_DATA[_selectedSpotId].ocupacion = fromEl.value + ' – ' + toEl.value;
    var spotEl = document.querySelector('.spot[data-spot="' + _selectedSpotId + '"]');
    if (spotEl) {
      spotEl.className = 'spot reservado';
    }
  }

  showToast('Reserva confirmada: Puesto ' + _selectedSpotId + ' · ' + plate + ' · ' + fromEl.value + '–' + toEl.value, 'success');
}
window.confirmReservation = confirmReservation;
