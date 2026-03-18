/* ================================================
   XVITYPING ADMIN — AUTH GUARD
   xvi7admin/js/admin-auth.js
   Runs first — redirects to login if no session
================================================ */

(function authGuard() {
  const raw = sessionStorage.getItem('xvt_admin_session');

  if (!raw) {
    redirect();
    return;
  }

  try {
    const session = JSON.parse(raw);
    if (!session.expires || Date.now() >= session.expires) {
      sessionStorage.removeItem('xvt_admin_session');
      redirect();
    }
  } catch (e) {
    redirect();
  }

  function redirect() {
    window.location.href = 'index.html';
  }
})();

/* ================================================
   LOGOUT
================================================ */

function doLogout() {
  sessionStorage.removeItem('xvt_admin_session');
  window.location.href = 'index.html';
}

/* ================================================
   EXTEND SESSION on activity
================================================ */

['click', 'keydown'].forEach(evt => {
  document.addEventListener(evt, () => {
    const raw = sessionStorage.getItem('xvt_admin_session');
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      s.expires = Date.now() + 8 * 60 * 60 * 1000;
      sessionStorage.setItem('xvt_admin_session', JSON.stringify(s));
    } catch (e) {}
  }, { passive: true });
});
