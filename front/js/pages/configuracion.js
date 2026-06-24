/* configuracion.js */
document.addEventListener('DOMContentLoaded', function () {

  /* Wire password visibility toggles */
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inp = document.getElementById(btn.getAttribute('data-toggle'));
      if (!inp) return;
      var isPassword = inp.type === 'password';
      inp.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁';
    });
  });

  /* Load last password change date */
  cargarFechaCambio();

  var btnCambiar = document.getElementById('btn-cambiar-pwd');
  if (btnCambiar) btnCambiar.addEventListener('click', handleCambioPassword);
});

async function cargarFechaCambio() {
  var el = document.getElementById('cfg-ultima-clave');
  var sessionID = sessionStorage.getItem('sessionID');
  if (!sessionID || !el) return;

  try {
    var res = await fetch('/api/perfil/fecha-clave', {
      headers: { 'Authorization': 'Bearer ' + sessionID }
    });
    if (res.ok) {
      var data = await res.json();
      if (data.fecha_cambio_clave) {
        var d = new Date(data.fecha_cambio_clave);
        el.textContent = d.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        el.textContent = 'No disponible';
      }
    } else {
      el.textContent = 'No disponible';
    }
  } catch (_) {
    el.textContent = 'No disponible';
  }
}

async function handleCambioPassword() {
  var errorEl = document.getElementById('cfg-error');
  var exitoEl = document.getElementById('cfg-exito');

  function showError(msg) {
    exitoEl.style.display = 'none';
    errorEl.textContent = msg;
    errorEl.style.display = '';
  }
  function showExito(msg) {
    errorEl.style.display = 'none';
    exitoEl.textContent = msg;
    exitoEl.style.display = '';
  }

  var actual    = (document.getElementById('cfg-pwd-actual')    || {}).value || '';
  var nueva     = (document.getElementById('cfg-pwd-nueva')     || {}).value || '';
  var confirmar = (document.getElementById('cfg-pwd-confirmar') || {}).value || '';

  if (!actual)              return showError('Ingrese su contraseña actual.');
  if (!nueva)               return showError('Ingrese la nueva contraseña.');
  if (nueva.length < 6)    return showError('La nueva contraseña debe tener al menos 6 caracteres.');
  if (nueva !== confirmar)  return showError('Las contraseñas nuevas no coinciden.');
  if (actual === nueva)     return showError('La nueva contraseña debe ser diferente a la actual.');

  var btn = document.getElementById('btn-cambiar-pwd');
  if (btn) { btn.disabled = true; btn.textContent = 'Actualizando…'; }
  errorEl.style.display = 'none';

  var sessionID = sessionStorage.getItem('sessionID');

  try {
    var res = await fetch('/api/perfil/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionID
      },
      body: JSON.stringify({ contrasena_actual: actual, contrasena_nueva: nueva })
    });

    var data = await res.json();

    if (res.ok) {
      showExito('Contraseña actualizada correctamente.');
      document.getElementById('form-password').reset();
      cargarFechaCambio();
    } else {
      showError(data.error || 'No se pudo actualizar la contraseña.');
    }
  } catch (_) {
    showError('Error de conexión con el servidor.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Actualizar contraseña'; }
  }
}
