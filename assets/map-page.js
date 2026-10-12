// Runs on both the map page (index.html) and the browse page (browse.html).
// Each part only renders if its element is on the page.
(function () {
  const { esc, GROUPS, groupColor, HAZARD, ACCESS, meter, loadSites, loadJSON, fmtCoord, makeMap, pin } = PAC;
  const BODIES = ['All', 'Mars', 'Moon', 'Europa', 'Enceladus', 'Titan', 'Early Earth'];
  const state = { q: '', body: 'All', types: new Set(), hz: 5, ac: 5, env: '', sort: 'name', dir: 1, selected: null };
  const $ = (id) => document.getElementById(id);
  const isMapPage = !!$('map');
  let SITES = [], map = null, markers = null;

  if (isMapPage) {
    map = makeMap('map');
    map.showWorld();
    PAC.addLabels(map);
    map.on('click', () => select(null));
    map.on('moveend zoomend', () => { const s = SITES.find((x) => x.id === state.selected); if (s && $('panel')) placePanel(s); });
    markers = L.layerGroup().addTo(map);
  }

  // On small screens, start with the extra filters folded away
  const more = $('more');
  if (more && window.matchMedia('(max-width: 700px)').matches) more.open = false;

  // Restore filters and selection from the address bar
  const params = new URLSearchParams(location.search);
  if (params.get('site')) state.selected = params.get('site');
  if (params.get('q')) state.q = params.get('q').toLowerCase();
  if (params.get('body')) state.body = params.get('body');

  Promise.all([loadSites(), loadJSON('data/vocab.json')]).then(([sites, vocab]) => {
    SITES = sites;
    if (state.selected && !SITES.find((s) => s.id === state.selected)) state.selected = null;
    buildFilters(vocab);
    if (isMapPage) buildLegend();
    render();
  }).catch((e) => {
    const target = $('panel') || $('rows');
    if (target) target.innerHTML = `<div class="pad">The site data could not be loaded (${esc(e.message)}). If you opened this file directly, run a local web server instead.</div>`;
  });

  function buildFilters(vocab) {
    const chips = $('bodyChips');
    chips.innerHTML = BODIES.map((b) => {
      const n = b === 'All' ? SITES.length : SITES.filter((s) => s.targets.includes(b)).length;
      return `<button type="button" data-body="${esc(b)}" aria-pressed="${b === state.body}">${esc(b)}<span class="n">${n}</span></button>`;
    }).join('');
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      state.body = b.dataset.body; render();
    });
    const present = vocab.analogue_type.filter((t) => SITES.some((s) => s.types.includes(t)));
    $('typeChecks').innerHTML = present.map((t) =>
      `<label class="check"><input type="checkbox" value="${esc(t)}"> ${esc(t.replace(' (instrument, rover or crew testing)', ' testing'))}</label>`).join('');
    $('typeChecks').addEventListener('change', (e) => {
      e.target.checked ? state.types.add(e.target.value) : state.types.delete(e.target.value); render();
    });
    const envSel = $('env');
    vocab.environment_type.filter((t) => SITES.some((s) => s.envs.includes(t))).forEach((t) => {
      const o = document.createElement('option'); o.value = t; o.textContent = t; envSel.appendChild(o);
    });
    envSel.addEventListener('change', () => { state.env = envSel.value; render(); });
    $('q').value = state.q;
    $('q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
    const hz = $('hz'), ac = $('ac');
    hz.addEventListener('input', () => { state.hz = +hz.value; render(); });
    ac.addEventListener('input', () => { state.ac = +ac.value; render(); });
    $('reset').addEventListener('click', () => {
      Object.assign(state, { q: '', body: 'All', hz: 5, ac: 5, env: '' }); state.types.clear();
      $('q').value = ''; hz.value = 5; ac.value = 5; envSel.value = '';
      document.querySelectorAll('#typeChecks input').forEach((i) => { i.checked = false; });
      render();
    });
    document.querySelectorAll('th button[data-sort]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.sort; state.dir = state.sort === k ? -state.dir : 1; state.sort = k; render();
    }));
    if ($('worldBtn')) $('worldBtn').addEventListener('click', () => map.flyTo([0, 0], map.getMinZoom(), { duration: 0.6 }));
  }

  function buildLegend() {
    const used = new Set(SITES.map((s) => s.group));
    const html = Object.entries(GROUPS).filter(([k]) => used.has(k)).map(([k, g]) =>
      `<span><span class="dot" style="background:${groupColor(k)}"></span>${esc(g.label)}${k === 'icy' ? ' (Europa, Enceladus)' : ''}</span>`).join('');
    $('legend').insertAdjacentHTML('afterbegin', html);
  }

  function matches(s) {
    if (state.body !== 'All' && !s.targets.includes(state.body)) return false;
    if (state.types.size && !s.types.some((t) => state.types.has(t))) return false;
    if (state.env && !s.envs.includes(state.env)) return false;
    if ((s.hazard_rating || 0) > state.hz) return false;
    if ((s.access_level || 0) > state.ac) return false;
    if (state.q) {
      const hay = [s.name, s.country, s.region, s.summary, ...(s.alt_names || []), ...(s.key_minerals || []), ...(s.rock_types || []), ...s.types, ...s.envs, ...s.targets].join(' ').toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function select(id) {
    state.selected = id;
    const u = new URL(location.href);
    if (id) u.searchParams.set('site', id); else u.searchParams.delete('site');
    history.replaceState(null, '', u);
    render();
  }

  function render() {
    document.querySelectorAll('#bodyChips button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.body === state.body)));
    $('hzOut').textContent = `Up to ${state.hz}: ${HAZARD[state.hz]}`;
    $('acOut').textContent = `Up to ${state.ac}: ${ACCESS[state.ac]}`;
    const vis = SITES.filter(matches).sort((a, b) => {
      const x = a[state.sort], y = b[state.sort];
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * state.dir;
    });
    $('count').textContent = `Showing ${vis.length} of ${SITES.length} sites`;
    $('empty').hidden = vis.length > 0;

    if (markers) {
      markers.clearLayers();
      vis.forEach((s) => {
        const m = pin(s, s.id === state.selected).bindTooltip(`${s.name}, ${s.country}`);
        m.on('click', () => select(s.id));
        m.addTo(markers);
        if (s.id === state.selected) m.bringToFront();
      });
    }

    if ($('rows')) {
      $('rows').innerHTML = vis.map((s) => `
        <tr>
          <td><a class="name" href="site.html?id=${encodeURIComponent(s.id)}">${esc(s.name)}</a><div class="muted" style="font-size:13px">${esc(s.country)}</div></td>
          <td><span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="width:10px;height:10px;background:${groupColor(s.group)}"></span>${esc(s.targets.join(', '))}</span></td>
          <td style="color:var(--ink-2)">${esc(s.environment_type_primary || '')}</td>
          <td><span style="display:flex;gap:8px;align-items:center">${meter(s.hazard_rating)}<span class="mono" style="font-size:12px">${s.hazard_rating || '–'}</span></span></td>
          <td style="color:var(--ink-2)"><span class="mono" style="font-size:12px">${s.access_level || '–'}</span> ${esc(ACCESS[s.access_level] || '')}</td>
          <td style="white-space:nowrap"><a href="index.html?site=${encodeURIComponent(s.id)}" style="font-size:13px">On map</a></td>
        </tr>`).join('');
    }

    if ($('panel')) renderPanel(SITES.find((s) => s.id === state.selected));
    if ($('hint')) $('hint').hidden = !!state.selected;
  }

  function renderPanel(s) {
    const el = $('panel');
    if (!s) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    const reviewed = s.rating_last_reviewed ? '' : '<span class="muted" style="font-size:12px">Proposed ratings, not yet reviewed</span>';
    el.innerHTML = `
      <div class="bar" style="background:${groupColor(s.group)}"></div>
      ${s.photos && s.photos.length ? `<img class="thumb" src="assets/photos/${esc(s.photos[0].file.replace('.jpg', '-sm.jpg'))}" alt="${esc(s.photos[0].caption || '')}">` : ''}
      <button type="button" class="close" id="closePanel" aria-label="Close preview">&times;</button>
      <div class="body">
        <div>
          <h2>${esc(s.name)}</h2>
          <div class="muted loc" title="${esc([s.region, s.country].filter(Boolean).join(', '))}">${esc(s.country)}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${s.targets.map((t, i) => `<span class="chip${i === 0 ? ' accent' : ''}">${esc(t)}</span>`).join('')}</div>
        <p class="sum">${esc(s.summary)}</p>
        <div class="mini">
          <div><span class="label">Hazard</span>${meter(s.hazard_rating)}<span>${s.hazard_rating ? `${s.hazard_rating} ${HAZARD[s.hazard_rating].toLowerCase()}` : 'Not rated'}</span></div>
          <div><span class="label">Access</span><span>${s.access_level ? `${s.access_level} ${ACCESS[s.access_level].toLowerCase()}` : 'Not rated'}</span></div>
          <div><span class="label">Permits</span><span>${esc(s.permits_required || 'Not recorded')}</span></div>
        </div>
        ${reviewed}
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <a class="btn primary" style="min-height:40px;flex:1" href="site.html?id=${encodeURIComponent(s.id)}">Open full entry</a>
          <a href="submit.html?edit=${encodeURIComponent(s.id)}" style="font-size:13px">Suggest a correction</a>
        </div>
      </div>`;
    $('closePanel').addEventListener('click', () => select(null));
    placePanel(s);
  }

  // Keep the card from covering the selected pin: move it to the other corner if needed
  function placePanel(s) {
    if (!map) return;
    const el = $('panel');
    if (getComputedStyle(el).position !== 'absolute') return;
    el.classList.remove('right');
    const p = map.latLngToContainerPoint([s.lat, s.lon]);
    const m = $('map').getBoundingClientRect(), r = el.getBoundingClientRect();
    const x = p.x + m.left, y = p.y + m.top;
    if (x > r.left - 14 && x < r.right + 14 && y > r.top - 14 && y < r.bottom + 14) el.classList.add('right');
  }
})();
