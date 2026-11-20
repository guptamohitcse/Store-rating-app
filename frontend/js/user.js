protectPage('user');
setupPasswordForm();

const state = { sort: 'name', order: 'asc' };
const msg = document.getElementById('msg');
const tbody = document.querySelector('#storesTable tbody');

function starsHtml(storeId, myRating) {
  let html = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<button title="${i} star${i > 1 ? 's' : ''}" data-store="${storeId}" data-value="${i}" class="${i <= (myRating || 0) ? 'on' : ''}">&#9733;</button>`;
  }
  html += '</div>';
  html += myRating
    ? `<span class="rating-text">You rated ${myRating}/5 - click to change</span>`
    : '<span class="rating-text">Not rated yet</span>';
  return html;
}

async function loadStores() {
  const params = {
    name: document.querySelector('#searchBox [name=name]').value.trim(),
    address: document.querySelector('#searchBox [name=address]').value.trim(),
    ...state,
  };

  try {
    const stores = await api('/stores?' + queryString(params));
    if (!stores.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No stores found</td></tr>';
      return;
    }
    tbody.innerHTML = stores.map((s) => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.address)}</td>
        <td>${formatRating(s.overallRating)}${s.totalRatings ? ` <span class="rating-text">(${s.totalRatings})</span>` : ''}</td>
        <td>${starsHtml(s.id, s.myRating)}</td>
      </tr>`).join('');
  } catch (err) {
    showError(msg, err);
  }
}

// clicking a star submits a new rating or modifies the old one
tbody.addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-store]');
  if (!button) return;
  hideMessage(msg);

  try {
    await api(`/stores/${button.dataset.store}/rating`, {
      method: 'POST',
      body: { rating: Number(button.dataset.value) },
    });
    loadStores();
  } catch (err) {
    showError(msg, err);
  }
});

document.getElementById('searchBox').addEventListener('input', debounce(loadStores));
setupSorting(document.getElementById('storesTable'), state, loadStores);
loadStores();
