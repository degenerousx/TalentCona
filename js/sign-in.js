(function () {
  // Scale the 1440 × 1024 artboard to fit the viewport on desktop sizes.
  var stage = document.getElementById('stage');
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var scale = w < 900 ? 1 : Math.min(w / 1440, h / 1024);
    stage.style.setProperty('--scale', scale);
  }
  fit();
  window.addEventListener('resize', fit);

  // Password visibility toggle.
  var toggle = document.getElementById('toggle-password');
  var password = document.getElementById('password');
  toggle.addEventListener('click', function () {
    var show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  document.getElementById('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
  });
})();
