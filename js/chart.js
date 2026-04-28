function renderChart(records) {
  const svg = document.getElementById('chart-svg');
  const loading = document.getElementById('chart-loading');

  if (records.length === 0) {
    loading.textContent = 'No data';
    loading.style.display = 'flex';
    svg.style.display = 'none';
    return;
  }

  loading.style.display = 'none';
  svg.style.display = 'block';
  svg.innerHTML = '';

  const sorted = [...records].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const W = svg.parentElement.getBoundingClientRect().width || 800;
  const H = 260;
  const PAD = { top: 20, right: 20, bottom: 40, left: 48 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const temps = sorted.map(r => r.temperature);
  const times = sorted.map(r => new Date(r.timestamp).getTime());
  const minT = Math.floor(Math.min(...temps)) - 2;
  const maxT = Math.ceil(Math.max(...temps)) + 2;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const xScale = t => PAD.left + ((t - minTime) / (maxTime - minTime || 1)) * cW;
  const yScale = v => PAD.top + cH - ((v - minT) / (maxT - minT)) * cH;

  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const val = minT + ((maxT - minT) / tickCount) * i;
    const y = yScale(val);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', PAD.left);
    line.setAttribute('x2', W - PAD.right);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#3d3a7a');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', PAD.left - 8);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', '#8883bb');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'DM Mono, monospace');
    label.textContent = Math.round(val);
    svg.appendChild(label);
  }

  const maxLabels = 6;
  const minLabelDistance = 90;
  const step = Math.max(1, Math.ceil(sorted.length / maxLabels));
  let lastLabelX = -Infinity;

  for (let i = 0; i < sorted.length; i += step) {
    const x = xScale(times[i]);
    if (x > W - PAD.right - 60) continue;
    if (x - lastLabelX < minLabelDistance) continue;

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', H - 22);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#8883bb');
    label.setAttribute('font-size', '10');
    label.setAttribute('font-family', 'DM Mono, monospace');
    label.textContent = formatTime(sorted[i].timestamp);
    svg.appendChild(label);

    lastLabelX = x;
  }

  const gmtLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  gmtLabel.setAttribute('x', W - PAD.right);
  gmtLabel.setAttribute('y', H - 6);
  gmtLabel.setAttribute('text-anchor', 'end');
  gmtLabel.setAttribute('fill', '#8883bb');
  gmtLabel.setAttribute('font-size', '10');
  gmtLabel.setAttribute('font-family', 'DM Mono, monospace');
  gmtLabel.textContent = 'GMT';
  svg.appendChild(gmtLabel);

  const points = sorted.map((r, i) => `${xScale(times[i])},${yScale(r.temperature)}`).join(' ');
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  poly.setAttribute('points', points);
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', '#a78bfa');
  poly.setAttribute('stroke-width', '2');
  poly.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(poly);

  const tooltip = document.getElementById('chart-tooltip');
  sorted.forEach((r, i) => {
    const cx = xScale(times[i]);
    const cy = yScale(r.temperature);

    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hit.setAttribute('cx', cx);
    hit.setAttribute('cy', cy);
    hit.setAttribute('r', '12');
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = 'pointer';

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    dot.setAttribute('x', cx - 6);
    dot.setAttribute('y', cy - 6);
    dot.setAttribute('width', '12');
    dot.setAttribute('height', '12');
    dot.setAttribute('rx', '3');
    dot.setAttribute('fill', '#211e52');
    dot.setAttribute('stroke', '#6c63ff');
    dot.setAttribute('stroke-width', '2');

    svg.appendChild(dot);
    svg.appendChild(hit);

    hit.addEventListener('mouseenter', () => showChartTooltip(r, cx, cy, W, H));
    hit.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
  });
}

function showChartTooltip(record, cx, cy, svgW, svgH) {
  const tooltip = document.getElementById('chart-tooltip');
  const chartCard = tooltip.parentElement;
  const svgEl = document.getElementById('chart-svg');
  const svgRect = svgEl.getBoundingClientRect();
  const cardRect = chartCard.getBoundingClientRect();

  const scaleX = svgRect.width / svgEl.viewBox.baseVal.width;
  const scaleY = svgRect.height / svgEl.viewBox.baseVal.height;

  const absX = svgRect.left + cx * scaleX;
  const absY = svgRect.top + cy * scaleY;

  let html = '';
  if (record.file_url) {
    if (record.event_type === 'image') {
      html += `<img src="${record.file_url}" alt="" onerror="this.style.display='none'"/>`;
    } else {
      html += `<video src="${record.file_url}" muted playsinline style="width:160px;height:100px;object-fit:cover;display:block;"></video>`;
    }
  }
  html += `<div class="chart-tooltip-info">
    <strong>${record.temperature}°C${tempBadge(record.temperature)}</strong>
    time: ${formatTime(record.timestamp)}<br/>
    date: ${formatDate(record.timestamp)}
  </div>`;

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';

  let left = absX - cardRect.left + 14;
  let top = absY - cardRect.top - 130;
  if (left + 180 > cardRect.width) left = absX - cardRect.left - 174;
  if (top < 0) top = absY - cardRect.top + 14;

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

window.addEventListener('resize', () => {
  if (allRecords.length > 0) renderChart(allRecords);
});
