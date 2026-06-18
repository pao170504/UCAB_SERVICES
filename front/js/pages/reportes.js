/* reportes.js — shared across all reportes sub-pages */
window.renderForRole = function (role) {
  var locked  = document.getElementById('view-locked');
  var prof    = document.getElementById('view-profesor');
  var admin   = document.getElementById('view-administrativo');

  var showLocked = (role === 'estudiante' || role === 'egresado');
  var showProf   = (role === 'profesor');
  var showAdmin  = (role === 'administrativo');

  if (locked) locked.style.display = showLocked ? '' : 'none';
  if (prof)   prof.style.display   = showProf   ? '' : 'none';
  if (admin)  admin.style.display  = showAdmin  ? '' : 'none';

  /* data-roles card visibility */
  document.querySelectorAll('[data-roles]').forEach(function (el) {
    var roles = el.getAttribute('data-roles').split(' ');
    el.style.display = roles.indexOf(role) !== -1 ? '' : 'none';
  });
};

document.addEventListener('DOMContentLoaded', function () {
  window.renderForRole(window.currentRole || 'estudiante');

  /* Tab switching */
  document.querySelectorAll('.tab-item[data-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var group = this.closest('.tab-group');
      var panelGroup = (this.closest('.tab-section') || document).querySelector('.tab-panels');
      group.querySelectorAll('.tab-item').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      var target = this.dataset.tab;
      if (panelGroup) {
        panelGroup.querySelectorAll('.tab-panel').forEach(function (p) {
          p.style.display = p.id === target ? '' : 'none';
        });
      }
    });
  });

  /* Wire up tables if present */
  ['response-table', 'audit-sec-table', 'conciliacion-table', 'comunidad-table'].forEach(function (id) {
    if (document.getElementById(id)) {
      makeTableSortable(id);
      makePaginated(id, 4);
    }
  });
});
