/* dashboard.js */
document.addEventListener('DOMContentLoaded', function () {
  makeTableSortable('audit-table');

  /* Set initial view based on current role */
  renderForRole(window.currentRole || 'estudiante');
});

window.renderForRole = function (role) {
  var views = { estudiante: 'view-estudiante', profesor: 'view-profesor' };
  var targetId = views[role] || 'view-estudiante';

  ['view-estudiante', 'view-profesor'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = (id === targetId) ? '' : 'none';
  });

  /* Re-init tables on view change */
  if (role === 'profesor') {
    if (document.getElementById('courses-table')) {
      makeTableSortable('courses-table');
    }
  } else {
    if (document.getElementById('audit-table')) {
      makeTableSortable('audit-table');
    }
  }
};

function openStudentModal(courseName) {
  var titleEl = document.getElementById('students-modal-title');
  if (titleEl) titleEl.textContent = 'Estudiantes — ' + courseName;
  openModal('students-modal');
}
