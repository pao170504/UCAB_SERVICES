/* registro.js */
document.addEventListener('DOMContentLoaded', function () {

  /* Password toggle helpers */
  function wireToggle(btnId, inputId) {
    var btn = document.getElementById(btnId);
    var inp = document.getElementById(inputId);
    if (btn && inp) {
      btn.addEventListener('click', function () {
        var isPassword = inp.type === 'password';
        inp.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁';
      });
    }
  }
  wireToggle('toggle-reg-password', 'reg-password');
  wireToggle('toggle-reg-confirm',  'reg-confirm-password');

  var btn = document.getElementById('btn-registrar');
  if (btn) btn.addEventListener('click', handleRegistro);
});

async function handleRegistro() {
  var errorEl = document.getElementById('registro-error');
  var exitoEl = document.getElementById('registro-exito');

  function showError(msg) {
    exitoEl.style.display = 'none';
    errorEl.textContent = msg;
    errorEl.style.display = '';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function showExito(msg) {
    errorEl.style.display = 'none';
    exitoEl.textContent = msg;
    exitoEl.style.display = '';
  }

  var cedula           = (document.getElementById('reg-cedula')           || {}).value || '';
  var sexo             = (document.getElementById('reg-sexo')             || {}).value || '';
  var fechaNac         = (document.getElementById('reg-fecha-nac')        || {}).value || '';
  var primerNombre     = (document.getElementById('reg-primer-nombre')    || {}).value || '';
  var segundoNombre    = (document.getElementById('reg-segundo-nombre')   || {}).value || '';
  var primerApellido   = (document.getElementById('reg-primer-apellido')  || {}).value || '';
  var segundoApellido  = (document.getElementById('reg-segundo-apellido') || {}).value || '';
  var correo           = (document.getElementById('reg-correo')           || {}).value || '';
  var sede             = (document.getElementById('reg-sede')             || {}).value || '';
  var telefono         = (document.getElementById('reg-telefono')         || {}).value || '';
  var ciudad           = (document.getElementById('reg-ciudad')           || {}).value || '';
  var estado           = (document.getElementById('reg-estado')           || {}).value || '';
  var calle            = (document.getElementById('reg-calle')            || {}).value || '';
  var password         = (document.getElementById('reg-password')         || {}).value || '';
  var confirmPassword  = (document.getElementById('reg-confirm-password') || {}).value || '';

  /* Client-side validation */
  if (!cedula.trim())          return showError('La cédula es obligatoria.');
  if (!/^\d+$/.test(cedula.trim())) return showError('La cédula debe contener solo números.');
  if (!sexo)                   return showError('Seleccione el sexo.');
  if (!fechaNac)               return showError('La fecha de nacimiento es obligatoria.');
  if (!primerNombre.trim())    return showError('El primer nombre es obligatorio.');
  if (!primerApellido.trim())  return showError('El primer apellido es obligatorio.');
  if (!segundoApellido.trim()) return showError('El segundo apellido es obligatorio.');
  if (!correo.trim())          return showError('El correo institucional es obligatorio.');
  if (!correo.includes('@ucab')) return showError('El correo debe pertenecer al dominio @ucab.edu.ve');
  if (!sede)                   return showError('Seleccione una sede.');
  if (!password)               return showError('La contraseña es obligatoria.');
  if (password.length < 6)    return showError('La contraseña debe tener al menos 6 caracteres.');
  if (password !== confirmPassword) return showError('Las contraseñas no coinciden.');

  var btn = document.getElementById('btn-registrar');
  if (btn) { btn.disabled = true; btn.textContent = 'Registrando…'; }
  if (errorEl) errorEl.style.display = 'none';

  try {
    var response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula:               cedula.trim(),
        sexo:                 sexo,
        fecha_nacimiento:     fechaNac,
        primer_nombre:        primerNombre.trim(),
        segundo_nombre:       segundoNombre.trim() || null,
        primer_apellido:      primerApellido.trim(),
        segundo_apellido:     segundoApellido.trim(),
        correo_institucional: correo.trim(),
        id_sede:              parseInt(sede, 10),
        contrasena:           password,
        ciudad:               ciudad.trim() || null,
        estado:               estado.trim() || null,
        calle:                calle.trim() || null,
        telefono:             telefono.trim() || null
      })
    });

    var data = await response.json();

    if (response.ok) {
      showExito('Cuenta creada exitosamente. Redirigiendo al inicio de sesión…');
      document.getElementById('form-registro').reset();
      setTimeout(function () { window.location.href = 'login.html'; }, 2000);
    } else {
      showError(data.error || 'No se pudo completar el registro.');
    }
  } catch (err) {
    showError('Error de conexión con el servidor. Intente nuevamente.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta →'; }
  }
}
