/* carrera.js — Career page (egresado only) */
var vacantesCache = [];

/* ---- CV panel: real user data from sessionStorage ---- */
function _updateCVPanel() {
  var usuario = getUsuario();
  if (!usuario) return;
  var rol     = sessionStorage.getItem('rolActivo') || usuario.roles[0].rol;
  var rolData = getRolData(rol);

  var initials = (usuario.nombre || '').trim().split(/\s+/).slice(0, 2)
    .map(function (w) { return w[0] || ''; }).join('').toUpperCase();

  var set = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('cv-avatar', initials);
  set('cv-name',   usuario.nombre);

  var matchEl = document.getElementById('cv-match');
  var gradEl  = document.getElementById('cv-grad-year');

  if (rol === 'egresado' && rolData) {
    set('cv-role-label', 'Egresado/a · ' + (rolData.titulo || '') + ' ' + (rolData.ano_graduacion || ''));
    set('cv-gpa', (parseFloat(rolData.indice_academico) || 0).toFixed(2));
    if (matchEl) matchEl.style.display = '';
    if (gradEl)  { gradEl.style.display = ''; gradEl.querySelector('strong').textContent = rolData.ano_graduacion || ''; }
  } else {
    set('cv-role-label', 'Estudiante');
    set('cv-gpa', '—');
    if (matchEl) matchEl.style.display = 'none';
    if (gradEl)  gradEl.style.display  = 'none';
  }
}

/* ---- Empty state ---- */
function _emptyState(msg) {
  return '<div class="empty-state">' +
    '<span style="font-size:2.5rem;">📋</span>' +
    '<h3>No hay vacantes disponibles</h3>' +
    '<p>' + (msg || 'Consulta nuevamente más tarde.') + '</p>' +
  '</div>';
}

/* ---- Job card from API data ---- */
function _jobCard(j) {
  var yaPost = j.ya_postulado;
  var score  = j.match_score !== null ? j.match_score : null;

  var scoreBadge = score !== null
    ? '<span class="badge badge-' + (score >= 70 ? 'success' : score >= 40 ? 'warning' : 'info') + '" ' +
      'style="margin-left:var(--space-2);">' + score + '% match</span>'
    : '';

  var btnArea = yaPost
    ? '<button type="button" class="btn btn-secondary btn-sm" disabled ' +
      'onclick="event.stopPropagation()">Ya postulado ✓</button>'
    : '<button type="button" class="btn btn-primary btn-sm" ' +
      'onclick="event.stopPropagation();postularVacante(\'' + j.id_vacante + '\')">Postular →</button>';

  var fecha = j.fecha_oferta ? new Date(j.fecha_oferta).toLocaleDateString('es-VE') : '';

  return '<div class="job-list-card" data-id="' + j.id_vacante + '" ' +
    'onclick="verDetalleVacante(\'' + j.id_vacante + '\')" style="cursor:pointer;">' +
    '<div class="job-list-header">' +
      '<div class="job-card-logo">🏢</div>' +
      '<div style="flex:1;">' +
        '<div class="job-list-title">' + j.cargo + scoreBadge + '</div>' +
        '<div class="job-list-company">' + j.empresa + '</div>' +
      '</div>' +
    '</div>' +
    '<p style="font-size:.84rem;color:var(--color-text-secondary);margin:0 0 var(--space-3);">' +
      j.responsabilidades + '</p>' +
    '<div class="job-benefits" style="margin-bottom:var(--space-3);">' +
      '<span class="job-benefit-item">👤 ' + j.perfil_buscado + '</span>' +
      (fecha ? '<span class="job-benefit-item">📅 Publicado: ' + fecha + '</span>' : '') +
      (j.beneficios ? '<span class="job-benefit-item">✨ ' + j.beneficios + '</span>' : '') +
    '</div>' +
    '<div class="job-list-footer">' +
      '<span style="font-size:.78rem;color:var(--color-text-muted);">' + j.id_vacante + '</span>' +
      '<div style="display:flex;gap:var(--space-2);">' + btnArea + '</div>' +
    '</div>' +
  '</div>';
}

/* ---- renderVacantes: receives API array, renders or shows empty state ---- */
function renderVacantes(vacantes, containerId) {
  var container = document.getElementById(containerId || 'tab-explorar');
  if (!container) return;
  if (!vacantes || vacantes.length === 0) {
    container.innerHTML = _emptyState();
    return;
  }
  var cards = vacantes.map(function (j) { return _jobCard(j); }).join('');
  container.innerHTML = '<div class="job-list">' + cards + '</div>';
}
window.renderVacantes = renderVacantes;

/* ---- API: fetch vacantes ---- */
async function cargarVacantes() {
  var explorar = document.getElementById('tab-explorar');
  if (explorar) explorar.innerHTML = '<p style="color:var(--color-text-muted);padding:var(--space-4);">Cargando vacantes…</p>';

  try {
    var sessionID = sessionStorage.getItem('sessionID') || '';
    var res  = await fetch('/api/vacantes', {
      headers: { 'Authorization': 'Bearer ' + sessionID }
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    vacantesCache = data.vacantes;
    renderVacantes(vacantesCache, 'tab-explorar');
  } catch (err) {
    if (explorar) explorar.innerHTML = _emptyState('Error al cargar las vacantes. ' + err.message);
  }
}

/* ---- API: fetch postulaciones ---- */
async function cargarPostulaciones() {
  var container = document.getElementById('tab-postulaciones');
  if (!container) return;
  container.innerHTML = '<p style="color:var(--color-text-muted);padding:var(--space-4);">Cargando postulaciones…</p>';

  try {
    var sessionID = sessionStorage.getItem('sessionID') || '';
    var res  = await fetch('/api/postulaciones', {
      headers: { 'Authorization': 'Bearer ' + sessionID }
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    var rows = data.postulaciones;

    if (!rows || rows.length === 0) {
      container.innerHTML = '<div class="empty-state"><span style="font-size:2.5rem;">📭</span>' +
        '<h3>Sin postulaciones aún</h3><p>Explora las vacantes disponibles y postúlate.</p></div>';
      return;
    }

    var tbody = rows.map(function (p) {
      var badge = {
        'En Revisión':  '<span class="badge badge-warning">En revisión</span>',
        'Seleccionado': '<span class="badge badge-success">Seleccionado</span>',
        'Rechazado':    '<span class="badge badge-danger">Rechazado</span>'
      }[p.estatus_postulacion] || '<span class="badge badge-info">' + p.estatus_postulacion + '</span>';

      var fecha = p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString('es-VE') : '';

      var retiroBtn = p.estatus_postulacion === 'En Revisión'
        ? '<button type="button" class="btn btn-outline btn-sm" ' +
          'style="color:var(--color-danger);border-color:var(--color-danger);" ' +
          'onclick="retirarPostulacion(\'' + p.id_vacante + '\')">Retirar</button>'
        : '';

      return '<tr>' +
        '<td><strong>' + p.cargo + '</strong></td>' +
        '<td>' + p.empresa + '</td>' +
        '<td>' + fecha + '</td>' +
        '<td>' + badge + '</td>' +
        '<td>' + retiroBtn + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="card">' +
        '<div class="card-header"><h4 class="card-title">Mis Postulaciones</h4></div>' +
        '<table class="table">' +
          '<thead><tr><th>Cargo</th><th>Empresa</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>' +
          '<tbody>' + tbody + '</tbody>' +
        '</table>' +
      '</div>';
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Error al cargar postulaciones.</p></div>';
  }
}

/* ---- API: postular ---- */
async function postularVacante(idVacante) {
  try {
    var sessionID = sessionStorage.getItem('sessionID') || '';
    var res  = await fetch('/api/vacantes/' + idVacante + '/postular', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + sessionID, 'Content-Type': 'application/json' }
    });
    var data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error al postularse.', 'error'); return; }
    showToast('¡Postulación enviada exitosamente!', 'success');
    cargarVacantes();
    cargarPostulaciones();
  } catch (err) {
    showToast('Error de conexión.', 'error');
  }
}
window.postularVacante = postularVacante;

/* ---- API: retirar postulación ---- */
async function retirarPostulacion(idVacante) {
  try {
    var sessionID = sessionStorage.getItem('sessionID') || '';
    var res  = await fetch('/api/vacantes/' + idVacante + '/postular', {
      method:  'DELETE',
      headers: { 'Authorization': 'Bearer ' + sessionID }
    });
    var data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error al retirar.', 'error'); return; }
    showToast('Postulación retirada.', 'success');
    cargarVacantes();
    cargarPostulaciones();
  } catch (err) {
    showToast('Error de conexión.', 'error');
  }
}
window.retirarPostulacion = retirarPostulacion;

/* ---- Egresado view shell (tabs only, data loaded async) ---- */
function _buildEgresado() {
  var tabs =
    '<div class="carrera-tabs">' +
      '<button type="button" class="carrera-tab active" data-tab="explorar" ' +
        'onclick="switchCarreraTab(\'explorar\')">Explorar vacantes</button>' +
      '<button type="button" class="carrera-tab" data-tab="postulaciones" ' +
        'onclick="switchCarreraTab(\'postulaciones\')">Mis Postulaciones</button>' +
    '</div>';
  var explorar  = '<div id="tab-explorar"></div>';
  var misPost   = '<div id="tab-postulaciones" style="display:none;"></div>';
  return tabs + explorar + misPost;
}

/* ---- Fallback for roles that cannot reach this page ---- */
function _buildRolNoPermitido() {
  return '<div class="empty-state">' +
    '<div style="font-size:3rem;">🔒</div>' +
    '<h3>Sección no disponible</h3>' +
    '<p>Esta sección es exclusiva para egresados UCAB.</p>' +
    '<a href="dashboard.html" class="btn btn-primary">Volver al Panel</a>' +
  '</div>';
}

/* ---- Public renderForRole (backward compat with nav.js) ---- */
window.renderForRole = function (role) {
  var right = document.getElementById('carrera-right');
  if (!right) return;
  _updateCVPanel();
  if (role === 'egresado') {
    right.innerHTML = _buildEgresado();
    cargarVacantes();
    cargarPostulaciones();
  } else {
    right.innerHTML = _buildRolNoPermitido();
  }
};

/* ---- Tab switching ---- */
function switchCarreraTab(tab) {
  document.querySelectorAll('.carrera-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  var explorar = document.getElementById('tab-explorar');
  var misPost  = document.getElementById('tab-postulaciones');
  if (explorar) explorar.style.display = (tab === 'explorar')      ? '' : 'none';
  if (misPost)  misPost.style.display  = (tab === 'postulaciones') ? '' : 'none';
  /* Load data on first open */
  if (tab === 'postulaciones') cargarPostulaciones();
}
window.switchCarreraTab = switchCarreraTab;

/* ---- Vacancy detail modal ---- */
function verDetalleVacante(idVacante) {
  var v = vacantesCache.find(function (x) { return x.id_vacante === idVacante; });
  if (!v) return;

  setModalField('modal-det-cargo',             v.cargo);
  setModalField('modal-det-empresa',           v.empresa);
  setModalField('modal-det-responsabilidades', v.responsabilidades);
  setModalField('modal-det-perfil',            v.perfil_buscado);
  setModalField('modal-det-beneficios',        v.beneficios || 'No especificado');
  setModalField('modal-det-fecha',
    v.fecha_oferta ? new Date(v.fecha_oferta).toLocaleDateString('es-VE') : '—');
  setModalField('modal-det-id', v.id_vacante);

  var matchEl = document.getElementById('modal-det-match');
  if (matchEl) {
    if (v.match_score > 0) {
      matchEl.textContent   = v.match_score + '% de compatibilidad';
      matchEl.className     = 'badge badge-success';
      matchEl.style.display = '';
    } else if (v.match_score === 0) {
      matchEl.textContent   = 'Perfil no compatible';
      matchEl.className     = 'badge badge-danger';
      matchEl.style.display = '';
    } else {
      matchEl.style.display = 'none';
    }
  }

  var btnPostular = document.getElementById('modal-det-btn-postular');
  if (btnPostular) {
    var esEgresado = tieneRol('egresado');
    if (!esEgresado || v.match_score === 0) {
      btnPostular.style.display = 'none';
    } else if (v.ya_postulado) {
      btnPostular.textContent   = '✓ Ya postulado';
      btnPostular.disabled      = true;
      btnPostular.style.display = '';
    } else {
      btnPostular.textContent   = 'Postular →';
      btnPostular.disabled      = false;
      btnPostular.style.display = '';
      btnPostular.onclick = function (e) {
        e.stopPropagation();
        closeModal('modal-detalle-vacante');
        postularVacante(v.id_vacante);
      };
    }
  }

  openModal('modal-detalle-vacante');
}
window.verDetalleVacante = verDetalleVacante;

/* ---- Modal: Ver perfil completo ---- */
async function verPerfilCompleto() {
  var usuario    = getUsuario();
  var egresado   = getRolData('egresado');
  var estudiante = getRolData('estudiante');

  var telefonos = [];
  var direccion = null;
  try {
    var sessionID = sessionStorage.getItem('sessionID') || '';
    var res  = await fetch('/api/perfil', {
      headers: { 'Authorization': 'Bearer ' + sessionID }
    });
    var data = await res.json();
    if (res.ok) {
      telefonos = data.telefonos || [];
      direccion = data.direccion || null;
    }
  } catch (err) {
    console.warn('No se pudo cargar el perfil:', err.message);
  }

  /* Title */
  var titleEl = document.getElementById('modal-cv-titulo');
  if (titleEl) titleEl.textContent = 'Perfil Académico — ' + (usuario.nombre || '');

  /* Información Personal */
  setModalField('cv-modal-cedula',    'V-' + (usuario.cedula || ''));
  setModalField('cv-modal-correo',    usuario.correo);
  setModalField('cv-modal-telefono',  telefonos.length > 0 ? telefonos.join(' / ') : 'No registrado');
  setModalField('cv-modal-direccion', direccion
    ? (direccion.calle || '') + ', ' + (direccion.ciudad || '') + ', ' + (direccion.estado || '')
    : 'No registrada');

  /* Semestre row: visible only for estudiante */
  var semestreRow = document.getElementById('cv-modal-semestre-row');
  if (semestreRow) semestreRow.style.display = estudiante ? '' : 'none';
  if (estudiante) setModalField('cv-modal-semestre', (estudiante.semestre || '') + 'vo Semestre');

  /* Trayectoria Académica */
  var trajectoryEl = document.getElementById('cv-modal-trayectoria');
  if (trajectoryEl) {
    if (egresado) {
      var ano    = egresado.ano_graduacion   || egresado.anoGraduacion   || '';
      var titulo = egresado.titulo           || '';
      var indice = parseFloat(egresado.indice_academico || egresado.indiceAcademico || 0).toFixed(2);
      trajectoryEl.innerHTML =
        '<div class="cv-timeline-item">' +
          '<span class="cv-timeline-date">UCAB · ' + ano + '</span>' +
          '<strong>' + titulo + '</strong>' +
          '<span>Universidad Católica Andrés Bello</span>' +
          '<span class="badge badge-success" style="margin-top:4px;align-self:flex-start;">' +
            'Índice académico: ' + indice + ' / 20' +
          '</span>' +
        '</div>';
    } else if (estudiante) {
      var prom    = parseFloat(estudiante.promedio || 0).toFixed(2);
      var uc      = estudiante.uc_aprobadas || estudiante.ucAprobadas || 0;
      var sem     = estudiante.semestre || '';
      var escuela = estudiante.escuela  || '';
      var fac     = estudiante.facultad || '';
      var becaBadge = estudiante.beca
        ? '<span class="badge badge-warning" style="margin-top:4px;align-self:flex-start;">Beca ' +
          estudiante.beca.tipo + ' — ' + estudiante.beca.estatus + '</span>'
        : '';
      var prepBadge = estudiante.preparador
        ? '<span class="badge badge-navy" style="margin-top:4px;align-self:flex-start;">Preparador: ' +
          estudiante.preparador.asignatura + '</span>'
        : '';
      trajectoryEl.innerHTML =
        '<div class="cv-timeline-item">' +
          '<span class="cv-timeline-date">UCAB · Activo</span>' +
          '<strong>' + escuela + '</strong>' +
          '<span>Universidad Católica Andrés Bello · Facultad de ' + fac + '</span>' +
          '<span class="badge badge-info" style="margin-top:4px;align-self:flex-start;">' +
            'GPA: ' + prom + ' / 20 · Semestre ' + sem + ' · ' + uc + ' UC aprobadas' +
          '</span>' +
          becaBadge + prepBadge +
        '</div>';
    }
  }

  openModal('modal-cv');
}
window.verPerfilCompleto = verPerfilCompleto;

/* ---- Descargar CV: print modal content as PDF ---- */
function descargarCV() {
  var modal = document.querySelector('#modal-cv .modal');
  if (!modal) return;

  var clone = modal.cloneNode(true);
  /* Remove interactive elements */
  var footer = clone.querySelector('.modal-footer');
  if (footer) footer.remove();
  var closeBtn = clone.querySelector('.modal-close');
  if (closeBtn) closeBtn.remove();

  var win = window.open('', '_blank', 'width=820,height=1000');
  win.document.write(
    '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
    '<title>CV — UCAB Services</title><style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
      'margin:2cm;color:#1a1a2e;font-size:14px;}' +
    'h3{font-size:1.25rem;margin:0 0 1.25rem;border-bottom:2px solid #1a1a2e;padding-bottom:.5rem;}' +
    '.cv-section{margin-bottom:1.5rem;}' +
    '.cv-section-title{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#777;margin:0 0 .75rem;font-weight:700;}' +
    '.cv-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:.4rem 2rem;}' +
    '.cv-grid-2 label{font-size:.75rem;color:#999;display:block;margin-bottom:2px;}' +
    '.cv-grid-2 p{margin:0;font-size:.9rem;font-weight:600;}' +
    '.cv-timeline-item{padding-left:1rem;border-left:3px solid #1a1a2e;margin-bottom:1rem;' +
      'display:flex;flex-direction:column;gap:.2rem;}' +
    '.cv-timeline-date{font-size:.75rem;color:#999;}' +
    '.cv-timeline-item strong{font-size:.95rem;}' +
    '.cv-timeline-item span{font-size:.85rem;color:#555;}' +
    '.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700;}' +
    '.badge-success{background:#d1fae5;color:#065f46;}' +
    '.badge-info{background:#dbeafe;color:#1e40af;}' +
    '.badge-warning{background:#fef3c7;color:#92400e;}' +
    '.badge-navy{background:#1a1a2e;color:#fff;}' +
    '.modal-header{margin-bottom:1.5rem;}' +
    '@media print{body{margin:1cm;}}' +
    '</style></head><body>' +
    clone.innerHTML +
    '</body></html>'
  );
  win.document.close();
  win.focus();
  setTimeout(function () { win.print(); }, 400);
}
window.descargarCV = descargarCV;

/* ---- Helper: set modal text field if element exists ---- */
function setModalField(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value || '—';
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function () {
  if (!tieneRol('egresado')) {
    var right = document.getElementById('carrera-right');
    if (right) {
      right.innerHTML =
        '<div class="empty-state" style="min-height:500px;">' +
          '<span style="font-size:3.5rem;">🔒</span>' +
          '<h3>Acceso restringido</h3>' +
          '<p>La Bolsa de Trabajo está disponible exclusivamente para egresados UCAB.<br>' +
          'Una vez completes tu proceso de egreso, tendrás acceso completo a las ' +
          'ofertas laborales y al sistema de postulación.</p>' +
          '<a href="dashboard.html" class="btn btn-primary">Ver mi progreso académico</a>' +
        '</div>';
    }
    return;
  }
  /* nav.js already called renderForRole (which builds tabs + triggers cargarVacantes).
     Just register the roleChanged listener for future switches. */
  document.addEventListener('roleChanged', function (e) {
    window.renderForRole(e.detail.rol);
  });
});
