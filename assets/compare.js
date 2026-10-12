// Side-by-side Earth and planet maps on a site page.
(function () {
  const { esc, makeMap, addLand, addLabels, pin, cssVar } = PAC;
  const { EARTH, BODIES } = PAC_PLANETS;
  const EARTH_R = 6371.0;
  const kmPerDeg = (r) => (2 * Math.PI * r) / 360;

  function tile(layer, extra) {
    if (layer.wms) {
      return L.tileLayer.wms(layer.wms, Object.assign({ layers: layer.layers, format: 'image/png', version: '1.1.1', attribution: layer.attribution, maxNativeZoom: layer.maxNative, maxZoom: 12 }, extra));
    }
    return L.tileLayer(layer.url, Object.assign({
      tileSize: layer.tileSize || 256, zoomOffset: layer.zoomOffset || 0, maxNativeZoom: layer.maxNative, maxZoom: 18,
      noWrap: true, opacity: layer.opacity == null ? 1 : layer.opacity, attribution: layer.attribution, crossOrigin: true
    }, extra));
  }

  function segmented(name, items, current, onPick) {
    return `<div class="seg" role="group" aria-label="${esc(name)}">${items.map((i) =>
      `<button type="button" data-k="${esc(i.key)}" aria-pressed="${i.key === current}">${esc(i.name)}</button>`).join('')}</div>`;
  }

  // Zoom level that shows `km` across a map `px` wide, for each projection
  const zoomMercator = (km, lat, px) => Math.log2((156543.03 * Math.cos(lat * Math.PI / 180) * px) / (km * 1000));
  // Near the poles a flat map stretches east–west, so also fit the distance north–south and use whichever zooms in more
  const zoomPlate = (km, lat, px, radius, pxH) => {
    const deg = Math.min(360, km / (kmPerDeg(radius) * Math.max(0.05, Math.cos(lat * Math.PI / 180))));
    const zLon = Math.log2((360 * px) / (512 * deg));
    const zLat = Math.log2((180 * (pxH || px * 0.75)) / (256 * Math.min(180, km / kmPerDeg(radius))));
    return Math.max(zLon, zLat);
  };

  function render(root, s) {
    const c = s.compare;
    if (!c || !BODIES[c.body]) { root.hidden = true; return; }
    const body = BODIES[c.body];
    const polar = Math.abs(c.lat) > 65;
    root.innerHTML = `
      <div class="pad stack" style="gap:10px">
        <h2>Earth and ${esc(c.body)}, side by side</h2>
        <p>${esc(c.why || '')}</p>
        <p class="muted" style="font-size:13px">${c.sources && c.sources.length ? 'Sources: ' + c.sources.map((x) => `<a href="${esc(x.url)}">${esc(x.title)}</a>`).join(' · ') : ''}${c.confidence && c.confidence !== 'high' ? ` · Pairing confidence: ${esc(c.confidence)}` : ''}</p>
      </div>
      <div class="pair">
        <div class="pane">
          <div class="pane-head"><span class="label">Earth</span><strong>${esc(s.name)}</strong></div>
          <div class="cmap" id="earthMap" role="region" aria-label="Map of ${esc(s.name)} on Earth"></div>
          <div class="ctrls">
            ${segmented('Earth base map', EARTH.bases, 'satellite')}
            <label class="check small"><input type="checkbox" data-ov="geology"> Geology</label>
            <label class="check small"><input type="checkbox" data-ov="names" checked> Place names</label>
          </div>
          <div class="info muted" id="rockInfo">Click the map to see what rock is at that spot.</div>
        </div>
        <div class="pane">
          <div class="pane-head"><span class="label">${esc(c.body)}</span><strong>${esc(c.area)}</strong></div>
          <div class="cmap" id="planetMap" role="region" aria-label="Map of ${esc(c.area)} on ${esc(c.body)}"></div>
          <div class="ctrls">
            ${segmented(c.body + ' base map', body.bases, body.bases[0].key)}
            ${body.geology ? '<label class="check small"><input type="checkbox" data-pov="geology"> Geology</label>' : ''}
            ${body.minerals.length ? `<label class="small">Mineralogy <select id="mineralSel"><option value="">None</option>${body.minerals.map((m) => `<option value="${esc(m.key)}">${esc(m.name)}</option>`).join('')}</select></label>
            <label class="small" id="opWrap" hidden>Opacity <input type="range" id="opacity" min="0.2" max="1" step="0.05" value="0.75" style="width:90px"></label>` : ''}
          </div>
          <div class="info muted" id="planetInfo">${polar ? 'Polar areas look stretched on flat maps. ' : ''}${body.minerals.length ? 'Choose a mineralogy layer to see composition.' : 'Composition maps are not yet available for this body.'}</div>
        </div>
      </div>
      <p class="banner warn" id="tileNote" hidden style="margin:0 24px 12px;font-size:14px">Some detailed map images couldn't load here, so low-resolution offline maps are shown instead. This happens in previews or offline; on the live website the detailed maps load normally.</p>
      <div class="pad" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding-top:0">
        <button type="button" class="btn" id="matchBtn">Match scale</button>
        <button type="button" class="btn" id="resetBtn">Reset views</button>
        <span class="muted" id="scaleNote" style="font-size:13px"></span>
      </div>`;

    // --- Earth map (standard web map projection, so geology and satellite tiles line up)
    const em = L.map('earthMap', { worldCopyJump: true, zoomSnap: 0.25, minZoom: 1, maxZoom: 16 });
    em.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    const eBase = {};
    EARTH.bases.forEach((b) => { eBase[b.key] = b.outline ? null : tile(b, { maxZoom: 18 }); });
    let outline = null, labels = null;
    const eOv = {};
    EARTH.overlays.forEach((o) => { eOv[o.key] = tile(o, { maxZoom: 18, pane: 'overlayPane' }); });
    eOv.geology.setZIndex(5); eOv.names.setZIndex(6);
    function setEarthBase(k) {
      Object.values(eBase).forEach((l) => l && em.removeLayer(l));
      if (k === 'outline') { if (!labels) labels = addLabels(em); labels.show(); }
      else { eBase[k].addTo(em); if (labels) labels.hide(); }
    }
    // Offline land outline always sits underneath, so the map is never blank if imagery can't load
    addLand(em);
    em.getPane('land').style.zIndex = 150; // below the satellite tiles
    setEarthBase('satellite'); eOv.names.addTo(em);
    L.circleMarker([s.lat, s.lon], { radius: 9, color: '#FFFFFF', weight: 3, fillColor: cssVar('--accent'), fillOpacity: 0.9 })
      .bindTooltip(s.name, { direction: 'top' }).addTo(em);

    // --- Planet map (flat, whole-body, same projection as the planetary tile services)
    const pm = makeMap('planetMap', { earth: false, maxZoom: 13 });
    pm.attributionControl.setPosition('topright');
    // Low-resolution offline map of the whole body underneath, shown if live tiles can't load
    if (body.fallback) {
      pm.createPane('fallback').style.zIndex = 150; // below the live tiles
      L.imageOverlay(body.fallback, [[-90, -180], [90, 180]], { interactive: false, pane: 'fallback' }).addTo(pm);
    }
    const pBase = {};
    body.bases.forEach((b) => {
      const g = L.layerGroup([tile(b)]);
      if (b.extra) g.addLayer(tile(b.extra, { bounds: b.extra.bounds }));
      pBase[b.key] = g;
    });
    let curBase = null;
    function setPlanetBase(k) {
      if (curBase) pm.removeLayer(curBase);
      curBase = pBase[k].addTo(pm);
      const b = body.bases.find((x) => x.key === k);
      legend(b && b.legend);
    }
    setPlanetBase(body.bases[0].key);
    const off = body.lonOffset || 0;
    const tlon = ((c.lon + off + 540) % 360) - 180;
    const target = L.circleMarker([c.lat, tlon], { radius: 9, color: '#FFFFFF', weight: 3, fillColor: cssVar('--accent'), fillOpacity: 0.9, bubblingMouseEvents: false })
      .bindTooltip(c.area, { direction: 'top' }).addTo(pm);
    let geo = null, mineral = null;

    let warned = false, fails = 0;
    function tilesFailed() {
      if (warned || ++fails < 3) return; warned = true;
      root.querySelector('#tileNote').hidden = false;
    }
    em.on('tileerror', tilesFailed); pm.on('tileerror', tilesFailed);
    em.eachLayer((l) => l.on && l.on('tileerror', tilesFailed));
    Object.values(eBase).forEach((l) => l && l.on('tileerror', tilesFailed));
    Object.values(pBase).forEach((g) => g.eachLayer((l) => l.on('tileerror', tilesFailed)));

    function legend(text, keyHtml) {
      const el = root.querySelector('#planetInfo');
      el.innerHTML = [keyHtml || '', text ? esc(text) : ''].join(' ') + (polar ? ' Polar areas look stretched on flat maps.' : '');
    }

    // --- Views: by default both maps show the same width of ground
    const width = (id) => document.getElementById(id).clientWidth || 400;
    function earthView(km) { em.setView([s.lat, s.lon], Math.min(14, zoomMercator(km, s.lat, width('earthMap')))); }
    function planetView(km) { pm.fitWorld(); pm.setView([c.lat, tlon], Math.max(pm.getMinZoom(), Math.min(12, zoomPlate(km, c.lat, width('planetMap'), body.radius, document.getElementById('planetMap').clientHeight)))); }
    const earthKm = () => {
      const b = em.getBounds(), y = em.getCenter().lat;
      return em.distance([y, b.getWest()], [y, b.getEast()]) / 1000;
    };
    function note(text) { root.querySelector('#scaleNote').textContent = text; }
    function reset() { earthView(c.view_km); planetView(c.view_km); note(`Both maps show about ${Math.round(c.view_km)} km across.`); }
    requestAnimationFrame(() => { em.invalidateSize(); pm.invalidateSize(); reset(); });

    root.querySelector('#matchBtn').addEventListener('click', () => {
      const km = earthKm(); planetView(km); note(`Matched: both maps now show about ${Math.round(km)} km across.`);
    });
    root.querySelector('#resetBtn').addEventListener('click', reset);
    em.on('zoomend', () => note(`Earth map: about ${Math.round(earthKm())} km across.`));

    // --- Controls
    root.querySelectorAll('.pane')[0].querySelector('.seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      setEarthBase(b.dataset.k);
      b.parentNode.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    root.querySelectorAll('[data-ov]').forEach((i) => i.addEventListener('change', () => {
      const l = eOv[i.dataset.ov]; i.checked ? l.addTo(em) : em.removeLayer(l);
      if (i.dataset.ov === 'geology') root.querySelector('#rockInfo').textContent = i.checked ? EARTH.overlays[0].legend : 'Click the map to see what rock is at that spot.';
    }));
    root.querySelectorAll('.pane')[1].querySelector('.seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      setPlanetBase(b.dataset.k);
      b.parentNode.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    const gBox = root.querySelector('[data-pov="geology"]');
    if (gBox) gBox.addEventListener('change', () => {
      if (gBox.checked) { geo = geo || tile(body.geology); geo.addTo(pm); legend(body.geology.legend); }
      else if (geo) { pm.removeLayer(geo); legend(''); }
    });
    const sel = root.querySelector('#mineralSel'), op = root.querySelector('#opacity');
    if (sel) {
      sel.addEventListener('change', () => {
        if (mineral) { pm.removeLayer(mineral); mineral = null; }
        const m = body.minerals.find((x) => x.key === sel.value);
        root.querySelector('#opWrap').hidden = !m || !!m.vector;
        if (!m) { legend(''); return; }
        if (m.vector) {
          mineral = L.layerGroup().addTo(pm);
          PAC.loadJSON(m.vector).then((gj) => {
            if (sel.value !== m.key) return;
            L.geoJSON(gj, {
              pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 4, weight: 1, color: '#FFFFFF', fillColor: (m.colours && m.colours[f.properties[m.field]]) || m.colour, fillOpacity: 0.9 })
                .bindTooltip(String(f.properties[m.field] || 'detection')),
              style: (f) => (f.geometry.type === 'Point' ? {} : { color: m.colour, weight: 1, fillColor: m.colour, fillOpacity: 0.55 })
            }).addTo(mineral);
          });
          const key = m.colours ? Object.entries(m.colours).map(([k, v]) => `<span class="keyitem"><span class="keydot" style="background:${v}"></span>${esc(k)}</span>`).join('') : '';
          legend(m.legend, key);
        } else {
          mineral = tile(m, { opacity: +op.value }).addTo(pm);
          op.value = m.opacity || 0.75; mineral.setOpacity(+op.value);
          legend(m.legend, '<span class="ramp" aria-hidden="true"></span>');
        }
        target.bringToFront();
      });
      op.addEventListener('input', () => { if (mineral && mineral.setOpacity) mineral.setOpacity(+op.value); });
    }

    // --- "What rock is here?" from Macrostrat
    em.on('click', (e) => {
      const info = root.querySelector('#rockInfo');
      info.textContent = 'Looking up the rock here…';
      fetch(`https://macrostrat.org/api/v2/geologic_units/map?lat=${e.latlng.lat.toFixed(4)}&lng=${e.latlng.lng.toFixed(4)}`)
        .then((r) => r.json()).then((d) => {
          const u = (d.success && d.success.data) || [];
          if (!u.length) { info.textContent = 'No geological map unit recorded here (open water or no data).'; return; }
          const x = u[0];
          const age = x.t_int_name && x.b_int_name ? (x.t_int_name === x.b_int_name ? x.t_int_name : `${x.b_int_name} to ${x.t_int_name}`) : '';
          info.innerHTML = `<strong>Rock here:</strong> ${esc(x.name || x.lith || 'Unnamed unit')}${x.lith && x.name ? ` (${esc(x.lith)})` : ''}${age ? ` · ${esc(age)}` : ''}${x.b_age != null ? `, ${esc(x.b_age)}–${esc(x.t_age)} million years old` : ''}. <span style="white-space:nowrap">Source: <a href="https://macrostrat.org">Macrostrat</a></span>`;
        }).catch(() => { info.textContent = 'The rock lookup is unavailable right now.'; });
    });
  }

  window.PAC_COMPARE = { render };
})();
