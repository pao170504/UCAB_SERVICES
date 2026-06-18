/* login.js */
document.addEventListener('DOMContentLoaded', function () {
  /* OTP auto-advance */
  const otpInputs = document.querySelectorAll('.otp-input');
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (this.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  /* Password show/hide */
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', function () {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      this.textContent = type === 'password' ? '👁' : '🙈';
    });
  }

  /* Sede tabs */
  document.querySelectorAll('.sede-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.sede-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  /* Login button */
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }
});
