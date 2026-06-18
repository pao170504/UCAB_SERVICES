document.addEventListener('DOMContentLoaded', () => {
  const sedeTabs = document.querySelectorAll('.sede-tab');
  sedeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sedeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  document.getElementById('toggle-password').addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';

    passwordInput.setAttribute('type', type);

    this.innerText = type === 'password' ? '👁' : '🙈';
  });

  const otpInputs = document.querySelectorAll('.otp-input');
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
  });
});

async function getCoords() {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: null, lon: null })
      );
    } else { resolve({ lat: null, lon: null }); }
  });
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const cedula = document.getElementById('cedula').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const sede = document.querySelector('.sede-tab.active').innerText.trim();

  let codigoMFA = "";
  document.querySelectorAll('.otp-input').forEach(i => codigoMFA += i.value);

  const { lat, lon } = await getCoords();

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, email, password, codigoMFA, lat, lon, sede })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('sessionID', data.sessionID);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión con el servidor");
  }
});