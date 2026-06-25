let sedeActiva   = 'Montalbán';
let cedulaActiva = null;

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('sessionID')) {
    window.location.href = '../pages/dashboard.html';
    return;
  }

  /* Hide MFA box until step 1 passes */
  const mfaBox = document.querySelector('.mfa-box');
  if (mfaBox) mfaBox.style.display = 'none';

  /* Sede tabs */
  document.querySelectorAll('.sede-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sede-tab')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sedeActiva = btn.dataset.sede;
    });
  });

  /* OTP auto-advance */
  document.querySelectorAll('.otp-input').forEach((input, idx, all) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/, '').slice(0, 1);
      if (input.value && idx < all.length - 1) all[idx + 1].focus();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && idx > 0)
        all[idx - 1].focus();
    });
  });

  /* Password toggle */
  document.getElementById('toggle-password')
    ?.addEventListener('click', () => {
      const p = document.getElementById('password');
      p.type = p.type === 'password' ? 'text' : 'password';
    });

  /* Step 1 button */
  document.getElementById('btn-login')
    ?.addEventListener('click', handlePreLogin);
});

/* ── helpers ─────────────────────────────────────────────────────────────── */
function getOTPValue() {
  return [...document.querySelectorAll('.otp-input')].map(i => i.value).join('');
}
function mostrarError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function ocultarError() {
  const el = document.getElementById('login-error');
  if (el) el.style.display = 'none';
}

function mostrarNotificacionMFA(codigo, expiraEn) {
  document.getElementById('notif-mfa')?.remove();
  const notif = document.createElement('div');
  notif.id = 'notif-mfa';
  notif.style.cssText = `
    position:fixed; top:24px; right:24px; z-index:9999;
    background:#0B1E2D; color:white;
    border-left:4px solid #1B6EF3;
    border-radius:12px; padding:20px 24px;
    box-shadow:0 8px 32px rgba(0,0,0,0.3);
    min-width:300px;
  `;
  notif.innerHTML = `
    <p style="margin:0 0 8px;font-size:.8rem;color:#9CA3AF">
      🔐 CÓDIGO DE VERIFICACIÓN · Válido ${Math.floor(expiraEn / 60)} min
    </p>
    <div style="text-align:center;font-size:2.4rem;font-weight:800;
      letter-spacing:.3em;color:#1B6EF3;
      background:rgba(27,110,243,.1);
      border-radius:8px;padding:12px;font-family:monospace">
      ${codigo}
    </div>
    <p style="margin:8px 0 0;font-size:.72rem;color:#6B7280;text-align:center">
      Ingresa este código en el formulario
    </p>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), expiraEn * 1000);
}

/* ── Step 1: validate credentials ────────────────────────────────────────── */
async function handlePreLogin() {
  ocultarError();
  const cedula   = document.getElementById('cedula').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!/^[VEve]-?\d{6,8}$/.test(cedula)) {
    mostrarError('Formato inválido. Ejemplo: V-30411315'); return;
  }
  if (!email.includes('@') || !email.toLowerCase().includes('ucab')) {
    mostrarError('El correo debe ser institucional @ucab.edu.ve'); return;
  }
  if (!password || password.length < 6) {
    mostrarError('La contraseña debe tener al menos 6 caracteres'); return;
  }

  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

  try {
    const res  = await fetch('/api/auth/pre-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, email, password, sede: sedeActiva })
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarError(data.error || 'Error al verificar credenciales.');
      if (btn) { btn.disabled = false; btn.textContent = 'Continuar →'; }
      return;
    }

    cedulaActiva = data.cedula;

    /* Show floating OTP notification */
    mostrarNotificacionMFA(data.codigo, data.expiraEn);

    /* Show MFA box */
    const mfaBox = document.querySelector('.mfa-box');
    if (mfaBox) mfaBox.style.display = '';
    document.querySelectorAll('.otp-input')[0]?.focus();

    /* Grey out step-1 button — credentials are locked in */
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Credenciales verificadas ✓';
      btn.style.opacity = '0.5';
    }

    /* Inject step-2 button if not already present */
    if (!document.getElementById('btn-step2')) {
      const btn2 = document.createElement('button');
      btn2.id        = 'btn-step2';
      btn2.type      = 'button';
      btn2.className = 'btn btn-primary btn-lg btn-full';
      btn2.textContent = 'Autorizar sesión →';
      btn2.style.marginTop = '12px';
      btn2.addEventListener('click', handleLogin);
      document.querySelector('.login-btn-wrapper')?.appendChild(btn2);
    }

  } catch (_) {
    mostrarError('No se pudo conectar con el servidor.');
    if (btn) { btn.disabled = false; btn.textContent = 'Continuar →'; }
  }
}

/* ── Step 2: validate OTP, open session ─────────────────────────────────── */
async function handleLogin() {
  ocultarError();
  const mfa = getOTPValue();
  if (mfa.length < 6) {
    mostrarError('Ingresa el código de 6 dígitos.'); return;
  }

  const btn2 = document.getElementById('btn-step2');
  if (btn2) { btn2.disabled = true; btn2.textContent = 'Verificando...'; }

  let lat = null, lon = null;
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
    );
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
  } catch (_) {}

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: cedulaActiva, codigoMFA: mfa,
        lat, lon, deviceName: getDeviceName()
      })
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarError(data.error || 'Código incorrecto.');
      if (btn2) { btn2.disabled = false; btn2.textContent = 'Autorizar sesión →'; }
      return;
    }

    document.getElementById('notif-mfa')?.remove();
    sessionStorage.setItem('sessionID', data.sessionID);
    sessionStorage.setItem('usuario',   JSON.stringify(data.usuario));
    window.location.href = '../pages/dashboard.html';

  } catch (_) {
    mostrarError('No se pudo conectar con el servidor.');
    if (btn2) { btn2.disabled = false; btn2.textContent = 'Autorizar sesión →'; }
  }
}

function getDeviceName() {
  const ua = navigator.userAgent;
  let os = 'Dispositivo', browser = '';
  if (/Windows NT 10/.test(ua))    os = 'Windows 11';
  else if (/Mac OS X/.test(ua))    os = 'macOS';
  else if (/Android/.test(ua))     os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua))       os = 'Linux';
  if (/Chrome\//.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua))               browser = 'Firefox';
  else if (/Safari\//.test(ua))                browser = 'Safari';
  else if (/Edg\//.test(ua))                   browser = 'Edge';
  return `${os}${browser ? ' · ' + browser : ''}`;
}
