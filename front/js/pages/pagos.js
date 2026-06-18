/* pagos.js */
document.addEventListener('DOMContentLoaded', function () {
  makeTableSortable('pagos-table');
  makePaginated('pagos-table', 4);
  makeTableSearchable('pagos-table', 'pagos-search');
  renderForRole(window.currentRole || 'estudiante');
});

window.renderForRole = function (role) {
  var note = document.getElementById('pagos-profesor-note');
  if (note) note.style.display = (role === 'profesor') ? '' : 'none';
};

function triggerPago(invoiceId, concept, amount) {
  PaymentModal.open({
    invoiceId: invoiceId,
    concept: concept,
    amountUSD: amount,
    bcvRate: 36.80,
    onSuccess: null
  });
}

/* Called by PaymentModal after step 3 close */
window.onPaymentComplete = function (data) {
  var invoiceKey = data.invoiceId.replace('#UCAB-', '');
  var statusEl = document.getElementById('status-' + invoiceKey);
  var rowEl    = document.getElementById('row-' + invoiceKey);

  if (statusEl) {
    if (data.paid) {
      statusEl.innerHTML = '<span class="badge badge-success">PAGADO</span>';
      /* Remove Pagar button */
      if (rowEl) { var btn = rowEl.querySelector('button'); if (btn) btn.remove(); }
    } else {
      statusEl.innerHTML = '<span class="badge badge-warning">PARCIAL</span>';
    }
  }
  showToast(data.paid ? 'Pago registrado exitosamente' : 'Abono registrado. Saldo restante: $' + data.remaining.toFixed(2), 'success');
};
