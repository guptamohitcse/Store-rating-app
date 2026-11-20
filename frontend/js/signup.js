const signupForm = document.getElementById('signupForm');
const msg = document.getElementById('msg');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage(msg);

  const values = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    password: document.getElementById('password').value,
  };

  const problems = validate(values, ['name', 'email', 'address', 'password']);
  if (problems.length) return showMessage(msg, problems);

  try {
    const data = await api('/auth/signup', { method: 'POST', body: values });
    showMessage(msg, data.message + ' Redirecting to login...', 'success');
    signupForm.reset();
    setTimeout(() => (window.location.href = 'index.html'), 1500);
  } catch (err) {
    showError(msg, err);
  }
});
