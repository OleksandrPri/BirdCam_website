function showLoginPage() {
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
}

async function showDashboardPage() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'flex';
  await loadDevices();
}

document.getElementById('login-btn').addEventListener('click', doLogin);
document.getElementById('password').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
document.getElementById('username').addEventListener('keydown', e => e.key === 'Enter' && doLogin());

async function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('show');

  try {
    const res = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      errEl.classList.add('show');
      return;
    }

    const data = await res.json();
    token = data.token;
    localStorage.setItem('jwt_token', token);

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'flex';
    await loadDevices();
  } catch {
    errEl.textContent = 'Connection error. Check API_BASE.';
    errEl.classList.add('show');
  }
}

document.getElementById('logout-btn').addEventListener('click', () => {
  token = null;
  localStorage.removeItem('jwt_token');
  allRecords = [];
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('password').value = '';
  document.getElementById('login-error').classList.remove('show');
});

async function loadDevices() {
  const res = await apiFetch('/devices');
  const devices = await res.json();

  const sel = document.getElementById('device-select');
  sel.innerHTML = '';
  devices.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.device_id;
    opt.textContent = d.device_id;
    sel.appendChild(opt);
  });

  if (devices.length > 0) {
    await loadDeviceData(devices[0].device_id);
  }

  sel.addEventListener('change', () => loadDeviceData(sel.value));
}

async function loadDeviceData(deviceId) {
  document.getElementById('chart-loading').style.display = 'flex';
  document.getElementById('chart-svg').style.display = 'none';
  document.getElementById('media-grid').innerHTML = '<div class="media-empty">Loading…</div>';
  document.getElementById('device-meta').textContent = 'loading…';

  const [dataRes, avgRes] = await Promise.all([
    apiFetch(`/devices/${deviceId}/data`),
    apiFetch(`/devices/${deviceId}/hourly-average`)
  ]);

  allRecords = await dataRes.json();
  await avgRes.json();

  const avgTemp = allRecords.length > 0
    ? (allRecords.reduce((s, r) => s + r.temperature, 0) / allRecords.length).toFixed(0)
    : '—';

  document.getElementById('device-meta').innerHTML =
    `<span>${allRecords.length} records</span> | average-hourly: <span>${avgTemp}°C</span>`;
  document.getElementById('media-count').textContent = allRecords.length;

  renderChart(allRecords);
  renderMedia(allRecords, activeFilter);
}

window.addEventListener('DOMContentLoaded', async () => {
  if (token) {
    try {
      await showDashboardPage();
    } catch {
      token = null;
      localStorage.removeItem('jwt_token');
      showLoginPage();
    }
  } else {
    showLoginPage();
  }
});
