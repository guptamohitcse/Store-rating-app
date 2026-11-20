// Small helpers shared by every page

const TOKEN_KEY = 'sr_token';
const USER_KEY = 'sr_user';
const HOME_PAGE = { admin: 'admin.html', user: 'user.html', owner: 'owner.html' };

// ---------- session ----------
function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}

// Call at the top of each dashboard page. Sends the person back to login
// if they are not logged in or if they opened a page that is not for their role.
function protectPage(role) {
  const user = getUser();
  if (!user || user.role !== role) {
    window.location.href = 'index.html';
    return null;
  }
  document.getElementById('welcome').textContent = user.name;
  document.getElementById('logoutBtn').addEventListener('click', logout);
  return user;
}

// ---------- talking to the backend ----------
async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch('/api' + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') logout(); // token expired
    const error = new Error(data.message || 'Something went wrong');
    error.details = data.errors || [];
    throw error;
  }
  return data;
}

function queryString(params) {
  return new URLSearchParams(params).toString();
}

// ---------- small UI helpers ----------
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function showMessage(el, text, type = 'error') {
  el.className = 'msg show ' + type;
  el.innerHTML = Array.isArray(text) ? text.map(escapeHtml).join('<br>') : escapeHtml(text);
}

function hideMessage(el) {
  el.className = 'msg';
}

function showError(el, error) {
  showMessage(el, error.details && error.details.length ? error.details : error.message, 'error');
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatRating(value) {
  return value === null || value === undefined ? 'No ratings yet' : value + ' / 5';
}

// ---------- client side validation (same rules as the backend) ----------
const Rules = {
  name: (v) => (v.length < 20 || v.length > 60 ? 'Name must be between 20 and 60 characters' : ''),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address'),
  address: (v) => (!v ? 'Address is required' : v.length > 400 ? 'Address can be at most 400 characters' : ''),
  password: (v) =>
    /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(v)
      ? ''
      : 'Password must be 8-16 characters with at least one uppercase letter and one special character',
};

// values = { name: '...', email: '...' } -> list of error messages
function validate(values, fields) {
  return fields.map((f) => Rules[f](values[f] ?? '')).filter(Boolean);
}

// ---------- sortable table headers ----------
// state = { sort: 'name', order: 'asc' }, reload = function that fetches again
function setupSorting(table, state, reload) {
  const headers = table.querySelectorAll('th[data-sort]');

  const paint = () => {
    headers.forEach((th) => {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === state.sort) th.classList.add(state.order);
    });
  };

  headers.forEach((th) => {
    th.addEventListener('click', () => {
      if (state.sort === th.dataset.sort) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = th.dataset.sort;
        state.order = 'asc';
      }
      paint();
      reload();
    });
  });
  paint();
}

// ---------- "change password" form (present on every dashboard) ----------
function setupPasswordForm() {
  const form = document.getElementById('passwordForm');
  const msg = document.getElementById('passwordMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(msg);

    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const problems = validate({ password: newPassword }, ['password']);
    if (problems.length) return showMessage(msg, problems);

    try {
      const data = await api('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } });
      showMessage(msg, data.message, 'success');
      form.reset();
    } catch (err) {
      showError(msg, err);
    }
  });
}
