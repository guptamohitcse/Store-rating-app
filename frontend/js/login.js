// If somebody is already logged in, skip the login page
const existing = getUser();
if (existing && HOME_PAGE[existing.role]) {
  window.location.href = HOME_PAGE[existing.role];
}

const loginForm = document.getElementById('loginForm');
const msg = document.getElementById('msg');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage(msg);

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      },
    });
    saveSession(data.token, data.user);
    window.location.href = HOME_PAGE[data.user.role];
  } catch (err) {
    showError(msg, err);
  }
});
