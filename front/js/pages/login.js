/* login.js */
document.addEventListener('DOMContentLoaded', function () {

  /* Redirect if already logged in */
  if (sessionStorage.getItem('sessionID')) {
    window.location.href = 'dashboard.html';
    return;
  }

  /* --- Sede tabs --- */
  var activeSede = 'Montalbán';
  document.querySelectorAll('.sede-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.sede-tab').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeSede = btn.getAttribute('data-sede') || btn.textContent.trim();
    });
  });

  /* --- OTP inputs: auto-advance and backspace --- */
  var otpInputs = document.querySelectorAll('.otp-input');
  otpInputs.forEach(function (input, idx) {
    input.addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(-1);
      if (e.target.value && idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        otpInputs[idx - 1].focus();
      }
    });
  });

  /* --- Password toggle --- */
  var toggleBtn = document.getElementById('toggle-password');
  var pwdInput  = document.getElementById('password');
  if (toggleBtn && pwdInput) {
    toggleBtn.addEventListener('click', function () {
      var isPassword = pwdInput.getAttribute('type') === 'password';
      pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });
  }

  /* --- Login button --- */
  var btn = document.getElementById('btn-login');
  if (btn) btn.addEventListener('click', handleLogin);
});

async function handleLogin() {
  var cedula   = (document.getElementById('cedula')   || {}).value || '';
  var email    = (document.getElementById('email')    || {}).value || '';
  var password = (document.getElementById('password') || {}).value || '';
  var errorEl  = document.getElementById('login-error');

  var codigoMFA = '';
  document.querySelectorAll('.otp-input').forEach(function (i) { codigoMFA += i.value; });

  var activeSede = 'Montalbán';
  var activeTab = document.querySelector('.sede-tab.active');
  if (activeTab) activeSede = activeTab.getAttribute('data-sede') || activeTab.textContent.trim();

  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = ''; }
  }

  if (!cedula.trim() || !email.trim() || !password) {
    return showError('Por favor complete todos los campos obligatorios.');
  }
  if (codigoMFA.length !== 6) {
    return showError('Ingrese los 6 dígitos del código de verificación.');
  }

  if (errorEl) errorEl.style.display = 'none';

  var btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Verificando…'; }

  /* Geolocation with 3s timeout — non-blocking */
  var coords = await _getCoords();

  try {
    var response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: cedula.trim(),
        email: email.trim(),
        password,
        codigoMFA,
        sede: activeSede,
        lat: coords.lat,
        lon: coords.lon
      })
    });

    var data = await response.json();

    if (response.ok) {
      sessionStorage.setItem('sessionID', data.sessionID);
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.href = 'dashboard.html';
    } else {
      showError(data.error || 'Error al iniciar sesión.');
    }
  } catch (err) {
    showError('Error de conexión con el servidor. Intente nuevamente.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Autorizar sesión →'; }
  }
}

function _getCoords() {
  return new Promise(function (resolve) {
    if (!navigator.geolocation) { resolve({ lat: null, lon: null }); return; }
    var timer = setTimeout(function () { resolve({ lat: null, lon: null }); }, 3000);
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      function () { clearTimeout(timer); resolve({ lat: null, lon: null }); }
    );
  });
}
