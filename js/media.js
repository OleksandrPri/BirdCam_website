document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderMedia(allRecords, activeFilter);
  });
});

function renderMedia(records, filter) {
  const grid = document.getElementById('media-grid');
  const filtered = filter === 'all' ? records : records.filter(r => r.event_type === filter);

  document.getElementById('media-count').textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="media-empty">No media found</div>';
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  grid.innerHTML = sorted.map((r, i) => {
    const mediaPart = r.event_type === 'image'
      ? `<img
           class="media-thumb"
           src="${r.file_url}"
           alt=""
           loading="lazy"
           onerror="this.style.display='none'"
         />`
      : `<div class="media-video-wrap">
           <video
             class="media-thumb"
             muted
             playsinline
             preload="metadata"
             style="width:100%;height:160px;object-fit:cover;"
           >
             <source src="${r.file_url}" type="video/mp4">
             Your browser does not support the video tag.
           </video>
           <div class="play-icon">▶</div>
         </div>`;

    return `<div class="media-card" data-idx="${i}" onclick="openLightbox(${records.indexOf(r)})">
      ${mediaPart}
      <div class="media-info">
        <div class="media-info-row">
          <span class="media-temp">${r.temperature}°C${tempBadge(r.temperature)}</span>
          <span class="media-type-badge ${r.event_type}">${r.event_type}</span>
        </div>
        <div class="media-time">${formatTime(r.timestamp)} · ${formatDate(r.timestamp)}</div>
      </div>
    </div>`;
  }).join('');
}

function openLightbox(idx) {
  const r = allRecords[idx];
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const vid = document.getElementById('lightbox-video');
  const meta = document.getElementById('lightbox-meta');

  img.style.display = 'none';
  vid.style.display = 'none';

  if (r.event_type === 'image') {
    img.src = r.file_url;
    img.style.display = 'block';
  } else {
    vid.src = r.file_url;
    vid.style.display = 'block';
  }

  meta.innerHTML = `<strong>${r.temperature}°C${tempBadge(r.temperature)}</strong> &nbsp;·&nbsp; ${formatTime(r.timestamp)}, ${formatDate(r.timestamp)} &nbsp;·&nbsp; <span style="color:var(--accent2)">${r.device_id}</span>`;
  lb.classList.add('show');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
  document.getElementById('lightbox-video').pause?.();
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeLightbox();
});
document.addEventListener('keydown', e => e.key === 'Escape' && closeLightbox());

document.getElementById('csv-btn').addEventListener('click', () => {
  if (!allRecords.length) return;

  const headers = ['timestamp', 'device_id', 'temperature', 'event_type', 'file_url'];
  const rows = allRecords.map(r => headers.map(h => {
    const val = r[h] ?? '';
    return String(val).includes(',') || String(val).includes('"')
      ? `"${String(val).replace(/"/g, '""')}"`
      : String(val);
  }).join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const deviceId = document.getElementById('device-select').value || 'data';
  const a = document.createElement('a');
  a.href = url;
  a.download = `birdcam_${deviceId}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});
