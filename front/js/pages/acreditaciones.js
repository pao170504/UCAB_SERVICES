/* acreditaciones.js — Mis Acreditaciones (página independiente).
   Usa /api/acreditaciones/* (catálogo + CRUD de las acreditaciones del usuario). */

function _sid() { return sessionStorage.getItem('sessionID'); }
function _headers() { return { 'Authorization': 'Bearer ' + _sid(), 'Content-Type': 'application/json' }; }

var _catalogoAcred = [];

function cargarMisAcred() {
  var cont = document.getElementById('acred-container');
  if (!cont) return;
  cont.innerHTML = '<p style="padding:var(--space-4);color:var(--color-text-muted);">Cargando...</p>';

  fetch('/api/acreditaciones/mis-acreditaciones', { headers: { 'Authorization': 'Bearer ' + _sid() } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var lista = data.acreditaciones || [];
      if (!lista.length) {
        cont.innerHTML =
          '<div style="padding:var(--space-6);text-align:center;">' +
          '<span style="font-size:2.5rem;">🎓</span>' +
          '<h3>Sin acreditaciones registradas</h3>' +
          '<p>Haga clic en "+ Agregar" para registrar una credencial.</p>' +
          '</div>';
        return;
      }
      var filas = lista.map(function (a) {
        var venc = a.fecha_vencimiento
          ? new Date(a.fecha_vencimiento).toLocaleDateString('es-VE') : 'Sin vencimiento';
        var obt  = a.obtencion ? new Date(a.obtencion).toLocaleDateString('es-VE') : '—';
        var estadoBadge = a.estado === 'Vigente'
          ? 'badge-success' : (a.estado === 'Vencida' ? 'badge-danger' : 'badge-warning');
        var idEsc = a.id_acreditacion.replace(/'/g, "\\'");
        return '<tr>' +
          '<td>' + a.tipo + '</td>' +
          '<td>' + (a.descripcion || '—') + '</td>' +
          '<td>' + obt + '</td>' +
          '<td>' + venc + '</td>' +
          '<td><span class="badge ' + estadoBadge + '">' + a.estado + '</span></td>' +
          '<td><button class="btn btn-sm" style="background:var(--color-danger);color:#fff;" ' +
            'onclick="eliminarAcred(\'' + idEsc + '\')">Eliminar</button></td>' +
          '</tr>';
      }).join('');
      cont.innerHTML =
        '<div class="table-wrap" style="border:none;border-radius:0;">' +
        '<table class="table"><thead><tr>' +
          '<th>TIPO</th><th>DESCRIPCIÓN</th><th>OBTENCIÓN</th><th>VENCIMIENTO</th><th>ESTADO</th><th></th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>';
    })
    .catch(function () {
      cont.innerHTML = '<p style="padding:var(--space-4);color:var(--color-danger);">No se pudieron cargar las acreditaciones.</p>';
    });
}

function abrirModalAcred() {
  var sel = document.getElementById('acred-select');
  document.getElementById('acred-obtencion').value = '';
  document.getElementById('acred-vencimiento').value = '';
  document.getElementById('acred-estado').value = 'Vigente';

  if (_catalogoAcred.length) {
    _poblarSelectAcred(sel);
    openModal('modal-acred-overlay');
    return;
  }

  fetch('/api/acreditaciones', { headers: { 'Authorization': 'Bearer ' + _sid() } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _catalogoAcred = data.acreditaciones || [];
      _poblarSelectAcred(sel);
      openModal('modal-acred-overlay');
    })
    .catch(function () { showToast('No se pudo cargar el catálogo', 'error'); });
}

function _poblarSelectAcred(sel) {
  sel.innerHTML = '<option value="">Seleccionar acreditación...</option>' +
    _catalogoAcred.map(function (a) {
      return '<option value="' + a.id_acreditacion + '">[' + a.tipo + '] ' + (a.descripcion || a.id_acreditacion) + '</option>';
    }).join('');
}

function guardarAcred() {
  var id   = document.getElementById('acred-select').value;
  var obt  = document.getElementById('acred-obtencion').value;
  var venc = document.getElementById('acred-vencimiento').value;
  var est  = document.getElementById('acred-estado').value;

  if (!id)  { showToast('Seleccione una acreditación', 'warning'); return; }
  if (!obt) { showToast('Ingrese la fecha de obtención', 'warning'); return; }

  fetch('/api/acreditaciones/mis-acreditaciones', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ id_acreditacion: id, obtencion: obt, fecha_vencimiento: venc || null, estado: est })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al registrar');
      showToast('Acreditación registrada', 'success');
      closeModal('modal-acred-overlay');
      cargarMisAcred();
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

function eliminarAcred(idAcred) {
  if (!confirm('¿Eliminar esta acreditación de su perfil?')) return;

  fetch('/api/acreditaciones/mis-acreditaciones/' + encodeURIComponent(idAcred), {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + _sid() }
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al eliminar');
      showToast('Acreditación eliminada', 'success');
      cargarMisAcred();
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

window.abrirModalAcred = abrirModalAcred;
window.guardarAcred    = guardarAcred;
window.eliminarAcred   = eliminarAcred;

document.addEventListener('DOMContentLoaded', function () {
  cargarMisAcred();
});
