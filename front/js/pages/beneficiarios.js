/* beneficiarios.js — Carga Menor y Carga Mayor */

var _cedulaActiva = null;

function _sid() { return sessionStorage.getItem('sessionID'); }
function _headers() { return { 'Authorization': 'Bearer ' + _sid(), 'Content-Type': 'application/json' }; }

/* ── Tabs ─────────────────────────────────────────────────────────── */
function cambiarTabBenef(tab) {
  ['menor', 'mayor'].forEach(function (t) {
    var sec = document.getElementById('tab-' + t);
    var pill = document.querySelector('[data-tab="' + t + '"]');
    if (sec)  sec.style.display  = (t === tab) ? '' : 'none';
    if (pill) pill.classList.toggle('active', t === tab);
  });

  cerrarPanelVacunas();

  if (tab === 'menor') cargarBeneficiarios();
  if (tab === 'mayor') cargarCargaMayor();
}

/* ════════════════════════════════════════════════════════════════════
   CARGA MENOR
   ════════════════════════════════════════════════════════════════════ */
function cargarBeneficiarios() {
  var cont = document.getElementById('beneficiarios-container');
  if (!cont) return;
  cont.innerHTML = '<p style="padding:var(--space-4);color:var(--color-text-muted);">Cargando...</p>';

  fetch('/api/beneficiarios', { headers: { 'Authorization': 'Bearer ' + _sid() } })
    .then(function (r) {
      if (r.status === 403) throw new Error('forbidden');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var lista = data.beneficiarios || [];
      if (!lista.length) {
        cont.innerHTML =
          '<div style="padding:var(--space-6);text-align:center;">' +
          '<span style="font-size:2.5rem;">👶</span>' +
          '<h3>Sin cargas menores registradas</h3>' +
          '<p>Haga clic en "Registrar hijo" para agregar un beneficiario.</p>' +
          '</div>';
        return;
      }

      var filas = lista.map(function (b) {
        var nombre = [b.primer_nombre, b.segundo_nombre, b.primer_apellido, b.segundo_apellido]
          .filter(Boolean).join(' ');
        var fechaNac = b.fecha_nacimiento
          ? new Date(b.fecha_nacimiento).toLocaleDateString('es-VE') : '—';
        var edad = b.fecha_nacimiento ? calcularEdad(b.fecha_nacimiento) : '—';
        var centro = b.centro_educacion_inicial ||
          '<span style="color:var(--color-text-muted)">No registrado</span>';
        var ced = b.cedula;
        var nomEsc = nombre.replace(/'/g, "\\'");
        var centEsc = (b.centro_educacion_inicial || '').replace(/'/g, "\\'");
        return '<tr>' +
          '<td class="font-mono text-sm">' + ced + '</td>' +
          '<td><strong>' + nombre + '</strong></td>' +
          '<td>' + fechaNac + ' <span class="badge badge-info">' + edad + ' años</span></td>' +
          '<td>' + b.parentesco + '</td>' +
          '<td>' + centro + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<button class="btn btn-outline btn-sm" style="margin-right:4px;" ' +
              'onclick="verVacunas(\'' + ced + '\',\'' + nomEsc + '\')">Vacunas</button>' +
            '<button class="btn btn-outline btn-sm" style="margin-right:4px;" ' +
              'onclick="abrirModalEditarMenor(\'' + ced + '\',\'' + centEsc + '\')">Editar</button>' +
            '<button class="btn btn-sm" style="background:var(--color-danger);color:#fff;" ' +
              'onclick="eliminarMenor(\'' + ced + '\',\'' + nomEsc + '\')">Eliminar</button>' +
          '</td></tr>';
      }).join('');

      cont.innerHTML =
        '<div class="table-wrap" style="border:none;border-radius:0;">' +
        '<table class="table"><thead><tr>' +
          '<th>CÉDULA</th><th>NOMBRE</th><th>FECHA NAC.</th>' +
          '<th>PARENTESCO</th><th>CENTRO EDUCATIVO</th><th></th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>';
    })
    .catch(function (err) {
      cont.innerHTML = err.message === 'forbidden'
        ? '<div style="padding:var(--space-5);text-align:center;"><span style="font-size:2rem;">🔒</span>' +
          '<p>Solo profesores y personal administrativo pueden gestionar beneficiarios.</p></div>'
        : '<p style="padding:var(--space-4);color:var(--color-danger);">No se pudieron cargar los beneficiarios.</p>';
    });
}

function calcularEdad(fechaNac) {
  var hoy = new Date(), nac = new Date(fechaNac);
  var edad = hoy.getFullYear() - nac.getFullYear();
  var m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function abrirModalMenor() {
  document.getElementById('form-menor').reset();
  openModal('modal-menor-overlay');
}

function guardarMenor(e) {
  e.preventDefault();
  var btn = document.getElementById('btn-guardar-menor');
  btn.disabled = true; btn.textContent = 'Registrando...';

  fetch('/api/beneficiarios', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({
      cedula:                   document.getElementById('cm-cedula').value.trim(),
      primer_nombre:            document.getElementById('cm-primer-nombre').value.trim(),
      segundo_nombre:           document.getElementById('cm-segundo-nombre').value.trim(),
      primer_apellido:          document.getElementById('cm-primer-apellido').value.trim(),
      segundo_apellido:         document.getElementById('cm-segundo-apellido').value.trim(),
      fecha_nacimiento:         document.getElementById('cm-fecha-nac').value,
      sexo:                     document.getElementById('cm-sexo').value,
      parentesco:               document.getElementById('cm-parentesco').value,
      centro_educacion_inicial: document.getElementById('cm-centro').value.trim()
    })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al registrar');
      showToast('Carga Menor registrada exitosamente', 'success');
      closeModal('modal-menor-overlay');
      cargarBeneficiarios();
    })
    .catch(function (err) { showToast(err.message, 'error'); })
    .finally(function () { btn.disabled = false; btn.textContent = 'Registrar'; });
}

function abrirModalEditarMenor(cedula, centroActual) {
  document.getElementById('edit-menor-cedula').value = cedula;
  document.getElementById('edit-menor-centro').value = centroActual;
  openModal('modal-editar-menor');
}

function guardarEdicionMenor() {
  var cedula = document.getElementById('edit-menor-cedula').value;
  var centro = document.getElementById('edit-menor-centro').value.trim();

  fetch('/api/beneficiarios/' + encodeURIComponent(cedula), {
    method: 'PUT',
    headers: _headers(),
    body: JSON.stringify({ centro_educacion_inicial: centro })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al actualizar');
      showToast('Centro educativo actualizado', 'success');
      closeModal('modal-editar-menor');
      cargarBeneficiarios();
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

function eliminarMenor(cedula, nombre) {
  if (!confirm('¿Eliminar a ' + nombre + ' de sus cargas menores? Esta acción no se puede deshacer.')) return;

  fetch('/api/beneficiarios/' + encodeURIComponent(cedula), {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + _sid() }
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al eliminar');
      showToast('Beneficiario eliminado', 'success');
      cerrarPanelVacunas();
      cargarBeneficiarios();
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

/* ── Panel de vacunas ─────────────────────────────────────────────── */
function verVacunas(cedula, nombre) {
  _cedulaActiva = cedula;
  var titulo = document.getElementById('vacunas-titulo');
  if (titulo) titulo.textContent = 'VACUNACIÓN — ' + nombre.toUpperCase();
  var panel = document.getElementById('panel-vacunas');
  if (panel) { panel.style.display = ''; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  _recargarVacunas(cedula);
}

function _recargarVacunas(cedula) {
  var list = document.getElementById('vacunas-list');
  if (!list) return;
  list.innerHTML = '<p style="color:var(--color-text-muted);">Cargando...</p>';

  fetch('/api/beneficiarios/' + encodeURIComponent(cedula) + '/vacunas', {
    headers: { 'Authorization': 'Bearer ' + _sid() }
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var vacunas = data.vacunas || [];
      if (!vacunas.length) {
        list.innerHTML = '<p style="color:var(--color-text-muted);">No hay vacunas registradas.</p>';
        return;
      }
      list.innerHTML = vacunas.map(function (v) {
        return '<div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2);">' +
          '<span class="badge badge-success">✓</span><span>' + v + '</span>' +
          '<button class="btn btn-sm" style="margin-left:auto;background:var(--color-danger);color:#fff;padding:2px 8px;" ' +
            'onclick="eliminarVacuna(\'' + cedula + '\',\'' + v.replace(/'/g, "\\'") + '\')">✕</button></div>';
      }).join('');
    })
    .catch(function () { list.innerHTML = '<p style="color:var(--color-danger);">Error al cargar vacunas.</p>'; });
}

function cerrarPanelVacunas() {
  _cedulaActiva = null;
  var panel = document.getElementById('panel-vacunas');
  if (panel) panel.style.display = 'none';
}

function agregarVacuna() {
  if (!_cedulaActiva) return;
  var input = document.getElementById('nueva-vacuna-input');
  var nombre = input.value.trim();
  if (!nombre) { showToast('Ingrese el nombre de la vacuna', 'warning'); return; }

  fetch('/api/beneficiarios/' + encodeURIComponent(_cedulaActiva) + '/vacunas', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ vacuna: nombre })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al agregar vacuna');
      input.value = '';
      showToast('Vacuna registrada', 'success');
      _recargarVacunas(_cedulaActiva);
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

function eliminarVacuna(cedula, vacuna) {
  fetch('/api/beneficiarios/' + encodeURIComponent(cedula) + '/vacunas/' + encodeURIComponent(vacuna), {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + _sid() }
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error');
      showToast('Vacuna eliminada', 'success');
      _recargarVacunas(cedula);
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

/* ════════════════════════════════════════════════════════════════════
   CARGA MAYOR
   ════════════════════════════════════════════════════════════════════ */
function cargarCargaMayor() {
  var cont = document.getElementById('carga-mayor-container');
  if (!cont) return;
  cont.innerHTML = '<p style="padding:var(--space-4);color:var(--color-text-muted);">Cargando...</p>';

  fetch('/api/beneficiarios/carga-mayor', { headers: { 'Authorization': 'Bearer ' + _sid() } })
    .then(function (r) {
      if (r.status === 403) throw new Error('forbidden');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var lista = data.beneficiarios || [];
      if (!lista.length) {
        cont.innerHTML =
          '<div style="padding:var(--space-6);text-align:center;">' +
          '<span style="font-size:2.5rem;">👨‍👩‍👧‍👦</span>' +
          '<h3>Sin cargas mayores registradas</h3>' +
          '<p>Haga clic en "Registrar dependiente" para agregar una carga mayor.</p>' +
          '</div>';
        return;
      }

      var filas = lista.map(function (b) {
        var nombre = [b.primer_nombre, b.segundo_nombre, b.primer_apellido, b.segundo_apellido]
          .filter(Boolean).join(' ');
        var edad = b.fecha_nacimiento ? calcularEdad(b.fecha_nacimiento) : '—';
        var solteroLabel = b.soltero === 'S' ? '<span class="badge badge-success">Sí</span>' : '<span class="badge badge-warning">No</span>';
        var ced = b.cedula;
        var nomEsc = nombre.replace(/'/g, "\\'");
        var constEsc = (b.constancia_estudio_universitario || '').replace(/'/g, "\\'");
        var solEsc = b.soltero || '';
        return '<tr>' +
          '<td class="font-mono text-sm">' + ced + '</td>' +
          '<td><strong>' + nombre + '</strong></td>' +
          '<td><span class="badge badge-info">' + edad + ' años</span></td>' +
          '<td>' + b.parentesco + '</td>' +
          '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;" title="' + constEsc + '">' +
            b.constancia_estudio_universitario + '</td>' +
          '<td>' + solteroLabel + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<button class="btn btn-outline btn-sm" style="margin-right:4px;" ' +
              'onclick="abrirModalEditarMayor(\'' + ced + '\',\'' + constEsc + '\',\'' + solEsc + '\')">Editar</button>' +
            '<button class="btn btn-sm" style="background:var(--color-danger);color:#fff;" ' +
              'onclick="eliminarMayor(\'' + ced + '\',\'' + nomEsc + '\')">Eliminar</button>' +
          '</td></tr>';
      }).join('');

      cont.innerHTML =
        '<div class="table-wrap" style="border:none;border-radius:0;">' +
        '<table class="table"><thead><tr>' +
          '<th>CÉDULA</th><th>NOMBRE</th><th>EDAD</th>' +
          '<th>PARENTESCO</th><th>CONSTANCIA</th><th>SOLTERO</th><th></th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>';
    })
    .catch(function (err) {
      cont.innerHTML = err.message === 'forbidden'
        ? '<div style="padding:var(--space-5);text-align:center;"><span style="font-size:2rem;">🔒</span>' +
          '<p>Solo profesores y personal administrativo pueden gestionar beneficiarios.</p></div>'
        : '<p style="padding:var(--space-4);color:var(--color-danger);">No se pudieron cargar las cargas mayores.</p>';
    });
}

function abrirModalMayor() {
  document.getElementById('form-mayor').reset();
  openModal('modal-mayor-overlay');
}

function guardarMayor(e) {
  e.preventDefault();
  var btn = document.getElementById('btn-guardar-mayor');
  btn.disabled = true; btn.textContent = 'Registrando...';

  fetch('/api/beneficiarios/carga-mayor', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({
      cedula:                          document.getElementById('maj-cedula').value.trim(),
      primer_nombre:                   document.getElementById('maj-primer-nombre').value.trim(),
      segundo_nombre:                  document.getElementById('maj-segundo-nombre').value.trim(),
      primer_apellido:                 document.getElementById('maj-primer-apellido').value.trim(),
      segundo_apellido:                document.getElementById('maj-segundo-apellido').value.trim(),
      fecha_nacimiento:                document.getElementById('maj-fecha-nac').value,
      sexo:                            document.getElementById('maj-sexo').value,
      parentesco:                      document.getElementById('maj-parentesco').value,
      constancia_estudio_universitario: document.getElementById('maj-constancia').value.trim(),
      soltero:                         document.getElementById('maj-soltero').value
    })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al registrar');
      showToast('Carga Mayor registrada exitosamente', 'success');
      closeModal('modal-mayor-overlay');
      cargarCargaMayor();
    })
    .catch(function (err) { showToast(err.message, 'error'); })
    .finally(function () { btn.disabled = false; btn.textContent = 'Registrar'; });
}

function abrirModalEditarMayor(cedula, constancia, soltero) {
  document.getElementById('edit-mayor-cedula').value = cedula;
  document.getElementById('edit-mayor-constancia').value = constancia;
  document.getElementById('edit-mayor-soltero').value = soltero;
  openModal('modal-editar-mayor');
}

function guardarEdicionMayor() {
  var cedula = document.getElementById('edit-mayor-cedula').value;
  var body = {
    constancia_estudio_universitario: document.getElementById('edit-mayor-constancia').value.trim(),
    soltero:                          document.getElementById('edit-mayor-soltero').value || undefined
  };

  fetch('/api/beneficiarios/carga-mayor/' + encodeURIComponent(cedula), {
    method: 'PUT',
    headers: _headers(),
    body: JSON.stringify(body)
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al actualizar');
      showToast('Carga Mayor actualizada', 'success');
      closeModal('modal-editar-mayor');
      cargarCargaMayor();
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

function eliminarMayor(cedula, nombre) {
  if (!confirm('¿Eliminar a ' + nombre + ' de sus cargas mayores? Esta acción no se puede deshacer.')) return;

  fetch('/api/beneficiarios/carga-mayor/' + encodeURIComponent(cedula), {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + _sid() }
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.data.error || 'Error al eliminar');
      showToast('Carga Mayor eliminada', 'success');
      cargarCargaMayor();
    })
    .catch(function (err) { showToast(err.message, 'error'); });
}

/* ── Init ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  cargarBeneficiarios();
});