// Shared helpers for every page.
(function () {
  const CFG = window.PAC_CONFIG || {};

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const GROUPS = {
    mars: { label: 'Mars', bodies: ['Mars'] },
    moon: { label: 'Moon', bodies: ['Moon', 'Mercury'] },
    icy: { label: 'Icy moons', bodies: ['Europa', 'Enceladus', 'Titan', 'Ganymede', 'Callisto', 'Icy moons (general)'] },
    early: { label: 'Early Earth', bodies: ['Early Earth'] },
    other: { label: 'Other', bodies: [] }
  };
  function groupOf(body) {
    for (const [k, g] of Object.entries(GROUPS)) if (g.bodies.includes(body)) return k;
    return 'other';
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function groupColor(k) { return cssVar('--' + k) || '#888888'; }

  const HAZARD = ['', 'Minimal', 'Low', 'Moderate', 'High', 'Extreme'];
  const ACCESS = ['', 'Open', 'Easy', 'Planned', 'Expedition', 'Restricted'];
  function meter(n, big) {
    if (!n) return '';
    const col = n >= 4 ? 'var(--bad)' : n === 3 ? 'var(--warn)' : 'var(--ok)';
    let h = `<span class="meter${big ? ' big' : ''}" role="img" aria-label="Hazard ${n} of 5">`;
    for (let i = 1; i <= 5; i++) h += `<span style="${i <= n ? 'background:' + col : ''}"></span>`;
    return h + '</span>';
  }

  let dataPromise = null;
  function loadSites() {
    if (!dataPromise) {
      dataPromise = fetch('data/sites.geojson').then((r) => {
        if (!r.ok) throw new Error('Could not load site data');
        return r.json();
      }).then((d) => d.features.map((f) => {
        const p = f.properties;
        p.lon = f.geometry.coordinates[0];
        p.lat = f.geometry.coordinates[1];
        p.targets = [p.analogue_for_primary, ...(p.analogue_for_other || [])].filter(Boolean);
        p.types = [p.analogue_type_primary, ...(p.analogue_type_other || [])].filter(Boolean);
        p.envs = [p.environment_type_primary, ...(p.environment_type_other || [])].filter(Boolean);
        p.group = groupOf(p.analogue_for_primary);
        return p;
      }));
    }
    return dataPromise;
  }
  function loadJSON(path) { return fetch(path).then((r) => r.json()); }

  function fmtCoord(lat, lon) {
    const a = Math.abs(lat), b = Math.abs(lon);
    return `${a}° ${lat >= 0 ? 'N' : 'S'}, ${b}° ${lon >= 0 ? 'E' : 'W'}`;
  }

  // Leaflet map of the whole Earth (plate carrée, so the world is exactly 2:1).
  // It can never zoom out further than the whole world, and can't be dragged off it.
  let landPromise = null;
  function makeMap(el, opts = {}) {
    const map = L.map(el, Object.assign({
      crs: L.CRS.EPSG4326, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 90, maxZoom: 9,
      maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1, attributionControl: true
    }, opts));
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    // Smallest zoom at which the world still fills the whole box
    map.fitWorld = () => {
      const s = map.getSize();
      const z = Math.log2(Math.max(s.x / 512, s.y / 256));
      map.setMinZoom(z);
      return z;
    };
    map.showWorld = () => map.setView([0, 0], map.fitWorld(), { animate: false });
    // Re-fit when the box changes size (fonts loading, layout changes), not just on window resize
    if (window.ResizeObserver) new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(map.getContainer());
    map.on('resize', () => {
      const wasOut = map.getZoom() <= map.getMinZoom() + 0.01;
      map.fitWorld();
      if (wasOut) map.showWorld();
    });
    if (opts.earth !== false) map.landLayer = addLand(map);
    return map;
  }
  // Offline land outline (Natural Earth), drawn under everything else
  function addLand(map) {
    const landStyle = () => ({ color: cssVar('--land-line'), weight: 0.6, fillColor: cssVar('--land'), fillOpacity: 1 });
    if (!map.getPane('land')) map.createPane('land').style.zIndex = 350;
    const group = L.layerGroup().addTo(map);
    landPromise = landPromise || loadJSON('data/land.geojson');
    landPromise.then((land) => L.geoJSON(land, { style: landStyle, interactive: false, pane: 'land',
      attribution: 'Land: <a href="https://www.naturalearthdata.com">Natural Earth</a>' }).addTo(group)).catch(() => {});
    return group;
  }

  // Grey place names: oceans and continents when zoomed out, countries as you zoom in
  const CONTINENTS = [['North America', 48, -100], ['South America', -16, -58], ['Europe', 53, 18], ['Africa', 6, 20],
    ['Asia', 50, 92], ['Oceania', -25, 134], ['Antarctica', -78, 30]];
  const OCEANS = [['Pacific Ocean', -10, -140], ['Atlantic Ocean', 8, -32], ['Indian Ocean', -22, 78], ['Southern Ocean', -60, -60], ['Arctic Ocean', 84, -20]];
  let labelPromise = null;
  function addLabels(map) {
    map.createPane('labels').style.zIndex = 380;
    map.getPane('labels').style.pointerEvents = 'none';
    const mk = (text, lat, lon, cls) => L.marker([lat, lon], { pane: 'labels', interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'maplabel ' + cls, html: `<span>${esc(text)}</span>`, iconSize: null }) });
    const continents = L.layerGroup(CONTINENTS.map(([n, a, o]) => mk(n, a, o, 'continent')));
    const oceans = L.layerGroup(OCEANS.map(([n, a, o]) => mk(n, a, o, 'ocean')));
    const tiers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    labelPromise = labelPromise || loadJSON('data/country-labels.json');
    labelPromise.then((list) => {
      list.forEach((c, i) => mk(c.n, c.lat, c.lon, 'country').addTo(tiers[i < 30 ? 0 : i < 90 ? 1 : 2]));
      update();
    }).catch(() => {});
    function show(layer, on) { if (on && !map.hasLayer(layer)) layer.addTo(map); if (!on && map.hasLayer(layer)) layer.remove(); }
    let enabled = true;
    function update() {
      if (!enabled) { [continents, oceans, ...tiers].forEach((l) => l.remove()); return; }
      const dz = map.getZoom() - map.getMinZoom();
      show(continents, dz < 1.0);
      show(oceans, dz < 2.5);
      show(tiers[0], dz >= 1.0);
      show(tiers[1], dz >= 1.9);
      show(tiers[2], dz >= 2.9);
    }
    map.on('zoomend', update);
    map.whenReady(update);
    return { update, hide: () => { enabled = false; update(); }, show: () => { enabled = true; update(); } };
  }

  function pin(p, selected) {
    return L.circleMarker([p.lat, p.lon], {
      radius: selected ? 10 : 7, color: selected ? cssVar('--ink') : cssVar('--pin-ring'),
      weight: selected ? 3 : 2, fillColor: groupColor(p.group), fillOpacity: 1, bubblingMouseEvents: false
    });
  }

  function citation(p) {
    const who = CFG.citeName || CFG.creditName || '[YOUR NAME]';
    const year = (p && p.date_added ? p.date_added.slice(0, 4) : new Date().getFullYear());
    const doi = CFG.doi ? ` https://doi.org/${CFG.doi}` : '';
    if (p) return `${who} (${year}). ${p.name}. Planetary Analogue Catalogue, entry ${p.id}, version ${CFG.version || '0.1'}.${doi}`;
    return `${who} (${new Date().getFullYear()}). Planetary Analogue Catalogue, version ${CFG.version || '0.1'}.${doi}`;
  }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function copy(text, msg) {
    const done = () => toast(msg || 'Copied');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => fallback());
    else fallback();
    function fallback() {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed: select the text instead'); }
      ta.remove();
    }
  }

  // Footer credit, version and DOI
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-credit]').forEach((e) => { e.textContent = CFG.creditName || '[YOUR NAME]'; });
    document.querySelectorAll('[data-version]').forEach((e) => { e.textContent = CFG.version || '0.1'; });
    document.querySelectorAll('[data-doi]').forEach((e) => {
      e.innerHTML = CFG.doi ? `DOI <a href="https://doi.org/${esc(CFG.doi)}">${esc(CFG.doi)}</a>` : 'DOI coming soon';
    });
    document.querySelectorAll('[data-repo]').forEach((e) => { e.href = `https://github.com/${CFG.githubRepo}`; });
  });

  window.PAC = { CFG, esc, addLabels, addLand, cssVar, GROUPS, groupOf, groupColor, HAZARD, ACCESS, meter, loadSites, loadJSON, fmtCoord, makeMap, pin, citation, copy, toast };
})();
