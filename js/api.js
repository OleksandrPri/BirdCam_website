const API_BASE = 'https://ktor-env.politecliff-5fb4f1a7.polandcentral.azurecontainerapps.io';

let token = localStorage.getItem('jwt_token');
let allRecords = [];
let activeFilter = 'all';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function tempColor(t) {
  if (t < 0)  return '#60a5fa';
  if (t < 10) return '#a78bfa';
  if (t < 20) return '#4ade80';
  return '#f97316';
}

function tempBadge(t) {
  if (t < 5)  return ' <span title="Very cold" style="font-size:1em;">🥶</span>';
  if (t > 15) return ' <span title="Very hot"  style="font-size:1em;">🔥</span>';
  return '';
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...opts, headers });

  if (res.status === 401) {
    token = null;
    localStorage.removeItem('jwt_token');
    showLoginPage();
  }

  return res;
}
