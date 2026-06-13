// popup.js
const CORE_DEFS = [
  {
    key: 'pro',
    label: 'Pro queries',
    remKey: 'remaining_pro',
    tip: 'General purpose Pro queries. Use for coding, drafting, Q&A.',
    accent: true,
  },
  {
    key: 'research',
    label: 'Research runs',
    remKey: 'remaining_research',
    tip: 'Deep multi-step research. Best for reports, competitive analysis, and cited content.',
  },
  {
    key: 'labs',
    label: 'Labs',
    remKey: 'remaining_labs',
    tip: 'Experimental and newer model runs. Use for edge-case exploration.',
  },
  {
    key: 'agentic',
    label: 'Agentic research',
    remKey: 'remaining_agentic_research',
    tip: 'Automated chain-of-thought workflows. Reserve for the most demanding tasks.',
  },
];

function timeAgo(ts) {
  if (!ts) return 'Never';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 5) return 'Just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function pct(used, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

function statusChip(remaining, limit) {
  if (limit === null) return `<span class="chip free"><span class="chip-dot"></span>Unlimited</span>`;
  if (limit === 0) return `<span class="chip empty"><span class="chip-dot"></span>Disabled</span>`;
  if (remaining === 0) return `<span class="chip low"><span class="chip-dot"></span>Exhausted</span>`;
  const ratio = remaining / limit;
  if (ratio <= 0.25) return `<span class="chip low"><span class="chip-dot"></span>Low</span>`;
  return `<span class="chip ok"><span class="chip-dot"></span>Good</span>`;
}

function renderCore(data) {
  const grid = document.getElementById('coreGrid');
  grid.innerHTML = '';

  // Free queries card
  const freeAvail = data.free_queries && data.free_queries.available;
  const freeCard = document.createElement('div');
  freeCard.className = 'metric-card';
  freeCard.innerHTML = `
    <div class="metric-label">Free queries <span class="chip ${freeAvail ? 'free' : 'empty'}"><span class="chip-dot"></span>${freeAvail ? 'Available' : 'Unavailable'}</span></div>
    <div class="metric-value-row">
      <div class="metric-value ${freeAvail ? 'accent' : ''}">${freeAvail ? '\u221e' : '0'}</div>
    </div>
    <div class="metric-progress-area">
      <div class="progress-footer" style="justify-content:flex-end">Fallback when Pro quota is spent</div>
    </div>
  `;
  grid.appendChild(freeCard);

  CORE_DEFS.forEach((def) => {
    const rem = data[def.remKey] ?? null;
    const isLow = rem !== null && rem <= 5;
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.title = def.tip;

    let valueHtml = '';
    let progressHtml = '';

    if (rem === null) {
      valueHtml = `<div class="metric-value-row"><div class="metric-value">\u2014</div></div>`;
      progressHtml = `<div class="metric-progress-area"></div>`;
    } else {
      const fillClass = rem === 0 ? 'empty' : isLow ? 'low' : '';
      valueHtml = `
        <div class="metric-value-row">
          <div class="metric-value ${def.accent && !isLow ? 'accent' : ''}">${rem}</div>
          <div class="metric-suffix">left</div>
        </div>
      `;
      progressHtml = `
        <div class="metric-progress-area">
          <div class="progress-track">
            <div class="progress-fill ${fillClass}" style="width:0%" data-target="${rem}" data-max="200"></div>
          </div>
          <div class="progress-footer">
            <span>${rem === 0 ? 'All used' : isLow ? 'Running low \u2014 use wisely' : 'Healthy headroom'}</span>
            <span>${rem} remaining</span>
          </div>
        </div>
      `;
    }

    card.innerHTML = `<div class="metric-label">${def.label}</div>${valueHtml}${progressHtml}`;
    grid.appendChild(card);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.progress-fill[data-target]').forEach(bar => {
      const rem = parseInt(bar.dataset.target, 10);
      const max = parseInt(bar.dataset.max, 10) || 200;
      const w = pct(max - rem, max);
      bar.style.width = w + '%';
    });
  });
}

function prettySourceName(key) {
  return key.replace(/_mcp_merge|_mcp_cashmere|_mcp|_alt|_direct/g, '').replace(/_/g, ' ');
}

function renderSources(data) {
  const section = document.getElementById('sourcesSection');
  section.innerHTML = '';

  const sourceMap = data.sources && data.sources.source_to_limit;
  if (!sourceMap) return;

  const entries = Object.entries(sourceMap)
    .filter(([, v]) => v.monthly_limit !== null && v.monthly_limit > 0)
    .sort((a, b) => (b[1].remaining ?? 0) - (a[1].remaining ?? 0));

  if (entries.length === 0) {
    section.innerHTML = `<div style="font-size:11px;color:var(--muted);text-align:center;padding:4px 0">No capped source quotas active</div>`;
    return;
  }

  entries.forEach(([name, info]) => {
    const row = document.createElement('div');
    row.className = 'source-row';
    row.innerHTML = `
      <div class="source-name">${prettySourceName(name)}</div>
      <div class="source-nums">${info.remaining ?? '\u2013'} / ${info.monthly_limit}</div>
      ${statusChip(info.remaining, info.monthly_limit)}
    `;
    section.appendChild(row);
  });
}

function renderSkeleton() {
  const grid = document.getElementById('coreGrid');
  grid.innerHTML = Array(5).fill(0).map(() => `
    <div class="metric-card">
      <div class="metric-label skeleton" style="grid-column:1/-1;width:55%;height:10px;margin-bottom:10px"></div>
      <div class="skeleton" style="width:60px;height:32px"></div>
      <div class="metric-progress-area">
        <div class="progress-track"><div class="progress-fill skeleton" style="width:50%"></div></div>
      </div>
    </div>
  `).join('');
}

async function loadData(forceRefresh = false) {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');

  if (!forceRefresh) {
    const stored = await chrome.storage.local.get('limits');
    if (stored.limits && Date.now() - stored.limits.fetchedAt < 60_000) {
      renderAll(stored.limits);
      btn.classList.remove('spinning');
      return;
    }
  }

  chrome.runtime.sendMessage({ type: 'FETCH_LIMITS' }, (res) => {
    btn.classList.remove('spinning');
    if (!res || !res.ok) {
      document.getElementById('errorBanner').hidden = false;
      document.getElementById('fetchedAt').textContent = 'Failed to fetch';
      return;
    }
    renderAll(res);
  });
}

function renderAll({ data, fetchedAt }) {
  document.getElementById('errorBanner').hidden = true;
  document.getElementById('fetchedAt').textContent = 'Updated ' + timeAgo(fetchedAt);
  renderCore(data);
  renderSources(data);
}

renderSkeleton();
loadData();

document.getElementById('refreshBtn').addEventListener('click', () => loadData(true));

setInterval(() => {
  chrome.storage.local.get('limits', (stored) => {
    if (stored.limits) {
      document.getElementById('fetchedAt').textContent = 'Updated ' + timeAgo(stored.limits.fetchedAt);
    }
  });
}, 15_000);
