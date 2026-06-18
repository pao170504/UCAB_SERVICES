/* =============================================================
   utils.js — Shared helpers: formatting, modal, toast, role
   ============================================================= */

/* Section: Currency / date helpers */
function formatCurrency(amount, currency) {
  currency = currency || 'USD';
  const num = parseFloat(amount);
  if (currency === 'USD') return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency === 'VES' || currency === 'BS') return 'Bs. ' + num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num.toFixed(2);
}

function formatDate(dateStr) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.getDate() + ' ' + months[d.getMonth()] + ', ' + d.getFullYear();
}

function formatDateTime() {
  const now = new Date();
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const pad = n => String(n).padStart(2, '0');
  return now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear() +
         ', ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
}

function setStatusBadge(value, map) {
  const entry = map[value] || map['default'] || { cls: 'badge-gray', label: value };
  return '<span class="badge ' + entry.cls + '">' + (entry.label || value) + '</span>';
}

function randomReceipt() {
  return 'REC-' + Math.floor(10000000 + Math.random() * 90000000);
}

/* Section: Modal */
function openModal(overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
}

/* Close modals when clicking outside */
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
});

/* Close on Escape key */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(function (el) {
      closeModal(el.id);
    });
  }
});

/* Section: Toast */
function showToast(message, type, duration) {
  type = type || 'success';
  duration = duration || 3500;

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '●') + '</span>' +
                    '<span class="toast-msg">' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('removing');
    setTimeout(function () { toast.remove(); }, 320);
  }, duration);
}

/* Section: Role state */
window.currentRole = window.currentRole || 'estudiante';
