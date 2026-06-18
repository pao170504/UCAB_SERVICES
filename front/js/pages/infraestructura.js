/* infraestructura.js */
document.addEventListener('DOMContentLoaded', function () {
  /* Tariff validation */
  const tariffInput = document.getElementById('tariff-input');
  const tariffWarning = document.getElementById('tariff-warning');
  const MAX_TARIFF = 95;

  if (tariffInput && tariffWarning) {
    tariffInput.addEventListener('input', function () {
      const val = parseFloat(this.value);
      if (!isNaN(val) && val > MAX_TARIFF) {
        tariffWarning.style.display = 'block';
      } else {
        tariffWarning.style.display = 'none';
      }
    });
  }

  /* Update button */
  const updateBtn = document.getElementById('tariff-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', function () {
      const val = parseFloat(tariffInput.value);
      if (!isNaN(val) && val <= MAX_TARIFF) {
        alert('Tarifa actualizada a ' + formatCurrency(val));
      }
    });
  }
});
