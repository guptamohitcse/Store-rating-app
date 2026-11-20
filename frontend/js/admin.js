protectPage('admin');
setupPasswordForm();

const userState = { sort: 'name', order: 'asc' };
const storeState = { sort: 'name', order: 'asc' };

// ---------- tabs ----------
document.querySelectorAll('.tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ---------- dashboard numbers ----------
async function loadStats() {
  const stats = await api('/admin/stats');
  document.getElementById('statUsers').textContent = stats.totalUsers;
  document.getElementById('statStores').textContent = stats.totalStores;
  document.getElementById('statRatings').textContent = stats.totalRatings;
}

// read the filter inputs inside a container into an object
function readFilters(containerId) {
  const filters = {};
  document.querySelectorAll(`#${containerId} input, #${containerId} select`).forEach((el) => {
    filters[el.name] = el.value.trim();
  });
  return filters;
}

// ---------- users list ----------
async function loadUsers() {
  const params = { ...readFilters('userFilters'), ...userState };
  const users = await api('/admin/users?' + queryString(params));
  const body = document.querySelector('#usersTable tbody');

  if (!users.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">No users found</td></tr>';
    return;
  }
  body.innerHTML = users.map((u) => `
    <tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.address)}</td>
      <td><span class="badge ${u.role}">${u.role === 'owner' ? 'store owner' : u.role}</span></td>
      <td><button class="link" data-id="${u.id}">View</button></td>
    </tr>`).join('');
}

document.querySelector('#usersTable tbody').addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  const user = await api('/admin/users/' + id);
  const rows = [
    ['Name', user.name],
    ['Email', user.email],
    ['Address', user.address],
    ['Role', user.role === 'owner' ? 'Store owner' : user.role],
  ];
  if (user.role === 'owner') rows.push(['Store rating', formatRating(user.rating)]);

  document.getElementById('detailsList').innerHTML = rows
    .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(String(value))}</dd>`)
    .join('');
  document.getElementById('detailsDialog').showModal();
});
document.getElementById('closeDetails').addEventListener('click', () => document.getElementById('detailsDialog').close());

// ---------- stores list ----------
async function loadStores() {
  const params = { ...readFilters('storeFilters'), ...storeState };
  const stores = await api('/admin/stores?' + queryString(params));
  const body = document.querySelector('#storesTable tbody');

  if (!stores.length) {
    body.innerHTML = '<tr><td colspan="4" class="empty">No stores found</td></tr>';
    return;
  }
  body.innerHTML = stores.map((s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.address)}</td>
      <td>${formatRating(s.rating)}</td>
    </tr>`).join('');
}

// filters + sorting
const reloadUsers = debounce(loadUsers);
const reloadStores = debounce(loadStores);
document.getElementById('userFilters').addEventListener('input', reloadUsers);
document.getElementById('storeFilters').addEventListener('input', reloadStores);
setupSorting(document.getElementById('usersTable'), userState, loadUsers);
setupSorting(document.getElementById('storesTable'), storeState, loadStores);

// ---------- add user ----------
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('userMsg');
  hideMessage(msg);

  const values = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    address: form.address.value.trim(),
    role: form.role.value,
  };
  const problems = validate(values, ['name', 'email', 'address', 'password']);
  if (problems.length) return showMessage(msg, problems);

  try {
    const data = await api('/admin/users', { method: 'POST', body: values });
    showMessage(msg, data.message, 'success');
    form.reset();
    loadUsers();
    loadStats();
    loadAvailableOwners();
  } catch (err) {
    showError(msg, err);
  }
});

// ---------- add store ----------
async function loadAvailableOwners() {
  const owners = await api('/admin/owners/available');
  const select = document.querySelector('#addStoreForm select[name=ownerId]');
  select.innerHTML = '<option value="">No owner yet</option>' +
    owners.map((o) => `<option value="${o.id}">${escapeHtml(o.name)} (${escapeHtml(o.email)})</option>`).join('');
}

document.getElementById('addStoreForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('storeMsg');
  hideMessage(msg);

  const values = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    address: form.address.value.trim(),
    ownerId: form.ownerId.value,
  };
  const problems = validate(values, ['name', 'email', 'address']);
  if (problems.length) return showMessage(msg, problems);

  try {
    const data = await api('/admin/stores', { method: 'POST', body: values });
    showMessage(msg, data.message, 'success');
    form.reset();
    loadStores();
    loadStats();
    loadAvailableOwners();
  } catch (err) {
    showError(msg, err);
  }
});

// first load
loadStats();
loadUsers();
loadStores();
loadAvailableOwners();
