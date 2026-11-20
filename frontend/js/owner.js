protectPage('owner');
setupPasswordForm();

const state = { sort: 'date', order: 'desc' };
const msg = document.getElementById('msg');

async function loadDashboard() {
  try {
    const data = await api('/owner/dashboard?' + queryString(state));

    if (!data.store) {
      document.getElementById('noStore').style.display = 'block';
      document.getElementById('storeArea').style.display = 'none';
      return;
    }

    document.getElementById('storeArea').style.display = 'block';
    document.getElementById('storeName').textContent = data.store.name;
    document.getElementById('average').textContent = data.average === null ? '-' : data.average + ' / 5';
    document.getElementById('total').textContent = data.total;

    const body = document.querySelector('#ratersTable tbody');
    if (!data.raters.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty">Nobody has rated your store yet</td></tr>';
      return;
    }
    body.innerHTML = data.raters.map((r) => `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.address)}</td>
        <td>${r.rating} / 5</td>
        <td>${new Date(r.ratedOn).toLocaleDateString()}</td>
      </tr>`).join('');
  } catch (err) {
    showError(msg, err);
  }
}

setupSorting(document.getElementById('ratersTable'), state, loadDashboard);
loadDashboard();
