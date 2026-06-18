/* =============================================================
   carrera.js — Career page role-based rendering
   ============================================================= */

var _JOB_DATA = [
  {
    id: 1,
    logo: '🏢',
    title: 'Desarrollador Junior Full-Stack',
    company: 'TechNova Solutions',
    location: 'Caracas · Presencial',
    salary: '$800 – $1,200 / mes',
    profile: 'Ing. Informática, 0-2 años exp.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    deadline: '30 Jun 2026',
    desc: 'Participarás en el desarrollo de plataformas web para clientes del sector financiero.'
  },
  {
    id: 2,
    logo: '📊',
    title: 'Analista de Datos',
    company: 'Mercantil Seguros',
    location: 'Caracas · Híbrido',
    salary: '$900 – $1,400 / mes',
    profile: 'Ing. Informática o Estadística',
    tags: ['Python', 'SQL', 'Power BI'],
    deadline: '15 Jul 2026',
    desc: 'Análisis de datos para el área de inteligencia de negocios y reportes ejecutivos.'
  },
  {
    id: 3,
    logo: '🔒',
    title: 'Especialista en Ciberseguridad',
    company: 'Banesco Banco Universal',
    location: 'Caracas · Presencial',
    salary: '$1,200 – $1,800 / mes',
    profile: 'Ing. Informática + certificaciones',
    tags: ['SIEM', 'ISO 27001', 'Ethical Hacking'],
    deadline: '10 Jul 2026',
    desc: 'Monitoreo de incidentes de seguridad y gestión de controles bajo ISO 27001.'
  }
];

/* ---- Public API ---- */
window.renderForRole = function (role) {
  var right = document.getElementById('carrera-right');
  if (!right) return;

  _updateCVPanel(role);

  if (role === 'profesor') {
    right.innerHTML = _buildProfesor();
  } else if (role === 'egresado') {
    right.innerHTML = _buildEgresado();
  } else if (role === 'administrativo') {
    right.innerHTML = _buildAdministrativo();
  } else {
    right.innerHTML = _buildEstudiante();
  }
};

function openApplication(jobTitle, company) {
  var title = document.getElementById('app-modal-title');
  if (title) title.textContent = 'Postular a: ' + jobTitle + ' — ' + company;
  openModal('application-modal');
}
window.openApplication = openApplication;

function submitApplication() {
  closeModal('application-modal');
  showToast('¡Postulación enviada con éxito! Te contactaremos pronto.', 'success');
}
window.submitApplication = submitApplication;

/* ---- CV panel update per role ---- */
function _updateCVPanel(role) {
  var profiles = {
    estudiante:     { avatar: 'MP', name: 'María Pérez',      label: 'Estudiante · 8vo Semestre',        gpa: '18.45', showMatch: true,  showGrad: false },
    egresado:       { avatar: 'AM', name: 'Ana Martínez',     label: 'Egresada · Ing. Informática 2023', gpa: '17.80', showMatch: true,  showGrad: true  },
    profesor:       { avatar: 'CR', name: 'Carlos Rodríguez', label: 'Docente · Profesor Asistente',     gpa: '—',     showMatch: false, showGrad: false },
    administrativo: { avatar: 'LP', name: 'Luis Pérez',       label: 'Administrativo · DIDT',            gpa: '—',     showMatch: false, showGrad: false }
  };
  var p = profiles[role] || profiles.estudiante;
  var set = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('cv-avatar',     p.avatar);
  set('cv-name',       p.name);
  set('cv-role-label', p.label);
  set('cv-gpa',        p.gpa);
  var matchEl = document.getElementById('cv-match');
  var gradEl  = document.getElementById('cv-grad-year');
  if (matchEl) matchEl.style.display = p.showMatch ? '' : 'none';
  if (gradEl)  gradEl.style.display  = p.showGrad  ? '' : 'none';
}

/* ---- Job card helper ---- */
function _jobTags(tags) {
  return tags.map(function (t) { return '<span class="badge badge-info">' + t + '</span>'; }).join('');
}

function _jobCard(j, mode) {
  var btnArea = '';
  if (mode === 'estudiante') {
    btnArea =
      '<button type="button" class="btn btn-outline btn-sm" ' +
        'onclick="showToast(\'Oferta guardada en tu lista\',\'success\')">🔖 Guardar</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" disabled title="Disponible al egresar">Postular</button>';
  } else if (mode === 'egresado') {
    btnArea =
      '<button type="button" class="btn btn-outline btn-sm" ' +
        'onclick="showToast(\'Oferta guardada en tu lista\',\'success\')">🔖 Guardar</button>' +
      '<button type="button" class="btn btn-primary btn-sm" ' +
        'onclick="openApplication(\'' + j.title.replace(/'/g, "\\'") + '\',\'' + j.company.replace(/'/g, "\\'") + '\')">Postular →</button>';
  } else if (mode === 'administrativo') {
    btnArea =
      '<button type="button" class="btn btn-secondary btn-sm" ' +
        'onclick="showToast(\'Vacante editada\',\'success\')">✏️ Editar</button>' +
      '<button type="button" class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);" ' +
        'onclick="showToast(\'Vacante finalizada\',\'success\')">Finalizar vacante</button>';
  }

  return '<div class="job-list-card">' +
    '<div class="job-list-header">' +
      '<div class="job-card-logo">' + j.logo + '</div>' +
      '<div style="flex:1;">' +
        '<div class="job-list-title">' + j.title + '</div>' +
        '<div class="job-list-company">' + j.company + '</div>' +
      '</div>' +
      '<span class="job-list-salary">' + j.salary + '</span>' +
    '</div>' +
    '<p style="font-size:.84rem;color:var(--color-text-secondary);margin:0 0 var(--space-3);">' + j.desc + '</p>' +
    '<div class="job-card-tags" style="margin-bottom:var(--space-3);">' + _jobTags(j.tags) + '</div>' +
    '<div class="job-benefits" style="margin-bottom:var(--space-3);">' +
      '<span class="job-benefit-item">📍 ' + j.location + '</span>' +
      '<span class="job-benefit-item">👤 ' + j.profile + '</span>' +
      '<span class="job-benefit-item">📅 Cierra: ' + j.deadline + '</span>' +
    '</div>' +
    '<div class="job-list-footer">' +
      '<span style="font-size:.78rem;color:var(--color-text-muted);">ID-JOB-00' + j.id + '</span>' +
      '<div style="display:flex;gap:var(--space-2);">' + btnArea + '</div>' +
    '</div>' +
  '</div>';
}

/* ---- View builders ---- */
function _buildEstudiante() {
  var info =
    '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-5);display:flex;align-items:flex-start;gap:var(--space-3);">' +
      '<span style="font-size:1.2rem;flex-shrink:0;">ℹ️</span>' +
      '<div>' +
        '<strong style="font-size:.875rem;color:#1e40af;">Bolsa de Trabajo UCAB — Modo Estudiante</strong>' +
        '<p style="font-size:.82rem;color:#3b82f6;margin:.25rem 0 0;">La postulación formal se habilitará al finalizar tu proceso de egreso. Por ahora puedes explorar y guardar ofertas de tu interés.</p>' +
      '</div>' +
    '</div>';
  var cards = _JOB_DATA.map(function (j) { return _jobCard(j, 'estudiante'); }).join('');
  return info + '<div class="job-list">' + cards + '</div>';
}

function _buildEgresado() {
  var tabs =
    '<div class="carrera-tabs">' +
      '<button type="button" class="carrera-tab active" data-tab="explorar" onclick="switchCarreraTab(\'explorar\')">Explorar vacantes</button>' +
      '<button type="button" class="carrera-tab" data-tab="postulaciones" onclick="switchCarreraTab(\'postulaciones\')">Mis Postulaciones <span class="badge badge-info" style="margin-left:4px;">3</span></button>' +
    '</div>';

  var cards = _JOB_DATA.map(function (j) { return _jobCard(j, 'egresado'); }).join('');
  var explorar =
    '<div id="tab-explorar"><div class="job-list">' + cards + '</div></div>';

  var misPost =
    '<div id="tab-postulaciones" style="display:none;">' +
      '<div class="card">' +
        '<div class="card-header"><h4 class="card-title">Mis Postulaciones</h4></div>' +
        '<table class="table">' +
          '<thead><tr><th>Cargo</th><th>Empresa</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead>' +
          '<tbody>' +
            '<tr><td><strong>Desarrollador Junior Full-Stack</strong></td><td>TechNova Solutions</td><td>10 Jun 2026</td>' +
              '<td><span class="badge badge-warning">En revisión</span></td>' +
              '<td><button type="button" class="btn btn-outline btn-sm" onclick="showToast(\'No hay actualizaciones nuevas\',\'info\')">Ver estado</button></td></tr>' +
            '<tr><td><strong>Analista de Datos</strong></td><td>Mercantil Seguros</td><td>5 Jun 2026</td>' +
              '<td><span class="badge badge-info">Entrevista pautada</span></td>' +
              '<td><button type="button" class="btn btn-outline btn-sm" onclick="showToast(\'Entrevista: 20 Jun 2026 · 10:00am\',\'success\')">Ver detalles</button></td></tr>' +
            '<tr><td><strong>Especialista en Ciberseguridad</strong></td><td>Banesco Banco Universal</td><td>1 Jun 2026</td>' +
              '<td><span class="badge badge-success">Finalista</span></td>' +
              '<td><button type="button" class="btn btn-outline btn-sm" onclick="showToast(\'¡Estás en la fase final! Espera contacto.\',\'success\')">Ver detalles</button></td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

  return tabs + explorar + misPost;
}

function _buildProfesor() {
  var infoCard =
    '<div style="background:var(--color-navy);border-radius:var(--radius-md);padding:var(--space-5);margin-bottom:var(--space-5);">' +
      '<h3 style="color:white;font-size:1rem;margin:0 0 var(--space-2);">Bolsa de Trabajo UCAB</h3>' +
      '<p style="color:rgba(255,255,255,.65);font-size:.875rem;margin:0 0 var(--space-4);line-height:1.6;">' +
        'Como docente, puedes recomendar estudiantes destacados a las empresas aliadas. ' +
        'Actualmente hay <strong style="color:white;">' + _JOB_DATA.length + ' vacantes activas</strong>.' +
      '</p>' +
      '<div style="display:flex;gap:var(--space-6);">' +
        '<div><div style="font-size:1.6rem;font-weight:800;color:var(--color-blue);">47</div><div style="font-size:.72rem;color:rgba(255,255,255,.5);text-transform:uppercase;">Empresas aliadas</div></div>' +
        '<div><div style="font-size:1.6rem;font-weight:800;color:var(--color-blue);">128</div><div style="font-size:.72rem;color:rgba(255,255,255,.5);text-transform:uppercase;">Egresados colocados</div></div>' +
        '<div><div style="font-size:1.6rem;font-weight:800;color:var(--color-blue);">' + _JOB_DATA.length + '</div><div style="font-size:.72rem;color:rgba(255,255,255,.5);text-transform:uppercase;">Vacantes activas</div></div>' +
      '</div>' +
    '</div>';

  var form =
    '<div class="card">' +
      '<div class="card-header"><h4 class="card-title">Recomendar a un estudiante</h4></div>' +
      '<div style="padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-4);">' +
        '<div class="form-group"><label class="form-label">Cédula de identidad del estudiante</label>' +
          '<input type="text" class="form-input" id="rec-cedula" placeholder="Ej. V-28.500.000"></div>' +
        '<div class="form-group"><label class="form-label">Empresa / Vacante</label>' +
          '<select class="form-select" id="rec-empresa"><option value="">Seleccionar empresa...</option>' +
            _JOB_DATA.map(function (j) { return '<option>' + j.company + ' — ' + j.title + '</option>'; }).join('') +
          '</select></div>' +
        '<div class="form-group"><label class="form-label">Mensaje de recomendación</label>' +
          '<textarea class="form-input" id="rec-mensaje" rows="4" style="resize:vertical;" ' +
            'placeholder="Describe las fortalezas del estudiante..."></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-primary" onclick="submitRecommendation()">Enviar recomendación →</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  return infoCard + form;
}

function _buildAdministrativo() {
  var toolbar =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);padding:var(--space-4) var(--space-5);background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-card);">' +
      '<div><strong style="font-size:.9rem;">Panel de administración</strong>' +
        '<span style="margin-left:var(--space-3);font-size:.78rem;color:var(--color-text-muted);">' + _JOB_DATA.length + ' vacantes · 47 empresas aliadas</span></div>' +
      '<div style="display:flex;gap:var(--space-2);">' +
        '<button type="button" class="btn btn-primary btn-sm" onclick="openModal(\'modal-nueva-vacante\')">+ Nueva vacante aliado</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="showToast(\'Redirigiendo a gestión de aliados...\',\'info\')">Gestionar aliados</button>' +
      '</div>' +
    '</div>';

  var cards = _JOB_DATA.map(function (j) { return _jobCard(j, 'administrativo'); }).join('');
  return toolbar + '<div class="job-list">' + cards + '</div>';
}

/* ---- Tab switching (Egresado) ---- */
function switchCarreraTab(tab) {
  document.querySelectorAll('.carrera-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  var explorar = document.getElementById('tab-explorar');
  var misPost  = document.getElementById('tab-postulaciones');
  if (explorar) explorar.style.display = (tab === 'explorar')      ? '' : 'none';
  if (misPost)  misPost.style.display  = (tab === 'postulaciones') ? '' : 'none';
}
window.switchCarreraTab = switchCarreraTab;

/* ---- Recommendation submit (Profesor) ---- */
function submitRecommendation() {
  var cedula  = (document.getElementById('rec-cedula')  || {}).value || '';
  var empresa = (document.getElementById('rec-empresa') || {}).value || '';
  var mensaje = (document.getElementById('rec-mensaje') || {}).value || '';
  if (!cedula.trim())  { showToast('Ingresa la cédula del estudiante', 'error'); return; }
  if (!empresa)        { showToast('Selecciona una empresa', 'error'); return; }
  if (!mensaje.trim()) { showToast('Escribe un mensaje de recomendación', 'error'); return; }
  showToast('Recomendación enviada exitosamente', 'success');
  var c = document.getElementById('rec-cedula');  if (c) c.value = '';
  var e = document.getElementById('rec-empresa'); if (e) e.value = '';
  var m = document.getElementById('rec-mensaje'); if (m) m.value = '';
}
window.submitRecommendation = submitRecommendation;

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function () {
  window.renderForRole(window.currentRole || 'estudiante');
});
